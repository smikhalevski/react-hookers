import { PubSub } from 'parallel-universe';
import { EffectCallback, HTMLAttributes, KeyboardEventHandler, RefObject, useEffect, useState } from 'react';
import { focusRing } from '../behaviors/focusRing';
import { useActionHandler } from '../behaviors/useActionHandler';
import { useCloseHandler } from '../behaviors/useCloseHandler';
import { requestFocus } from '../behaviors/useFocus';
import { PressableProps, usePressable } from '../behaviors/usePressable';
import { FocusableElement } from '../types';
import { useFunctionOnce } from '../useFunctionOnce';
import { useUniqueId } from '../useUniqueId';
import { getTextDirection } from '../utils/dom';
import { emptyObject } from '../utils/lang';
import { mergeProps } from '../utils/mergeProps';

export class HeadlessMenuState {
  registeredIds = new Set<string>();

  private pubSub = new PubSub();

  constructor(
    public expandedId?: string | undefined,
    public tabbableId?: string | undefined
  ) {}

  setExpandedId(id: string | undefined): void {
    this.expandedId = id;
    this.pubSub.publish();
  }

  setTabbableId(id: string | undefined): void {
    this.tabbableId = id;
    this.pubSub.publish();
  }

  registerId(id: string): () => void {
    this.registeredIds.add(id);

    if (this.tabbableId === undefined) {
      this.setTabbableId(id);
    }

    return () => {
      this.registeredIds.delete(id);
    };
  }

  subscribe(listener: () => void): () => void {
    return this.pubSub.subscribe(listener);
  }
}

/**
 * A value returned from the {@link useMenu} hook.
 *
 * @group Components
 */
export interface HeadlessMenuValue {
  /**
   * Props of an element that must have a menu behaviour.
   *
   * An object which identity never changes between renders.
   */
  menuProps: HTMLAttributes<HTMLElement>;
}

/**
 * Props of the {@link useMenu} hook.
 *
 * @group Components
 */
export interface HeadlessMenuProps {
  /**
   * A handler that is called when a user requested to close the menu by pressing an arrow key.
   */
  onClose?: () => void;
}

/**
 * A menu displays a list of actions or options that a user can choose.
 *
 * @example
 * function Menu(props) {
 *   const selection = useFunctionOnce(createSelection);
 *   const { menuProps } = useMenu(props);
 *
 *   return (
 *     <SelectionProvider value={selection}>
 *       <ul {...menuProps}>{props.children}</ul>
 *     </SelectionProvider>
 *   );
 * }
 *
 * function MenuItem(props) {
 *   const selection = useSelection();
 *   const menuItemRef = useRef(null);
 *   const { menuItemProps } = useMenuItem(menuItemRef, selection, props);
 *
 *   return (
 *     <li
 *       {...menuItemProps}
 *       ref={menuItemRef}
 *     >
 *       {props.children}
 *     </li>
 *   );
 * }
 *
 * <Menu>
 *   <MenuItem>{'Hello'}</MenuItem>
 * </Menu>
 *
 * @param props Menu props.
 * @group Components
 */
export function useMenu(props: HeadlessMenuProps = emptyObject): HeadlessMenuValue {
  const manager = useFunctionOnce(createMenuManager);

  manager.props = props;

  return manager.value;
}

interface MenuManager {
  props: HeadlessMenuProps;
  value: HeadlessMenuValue;
}

function createMenuManager(): MenuManager {
  const handleArrowKeyDown: KeyboardEventHandler = event => {
    const { onClose } = manager.props;

    if (
      event.defaultPrevented ||
      event.key !== (getTextDirection() === 'rtl' ? 'ArrowRight' : 'ArrowLeft') ||
      onClose === undefined
    ) {
      return;
    }

    focusRing.reveal();
    event.preventDefault();

    onClose();
  };

  const manager: MenuManager = {
    props: undefined!,
    value: {
      menuProps: {
        role: 'menu',
        tabIndex: -1,
        onKeyDown: handleArrowKeyDown,
      },
    },
  };

  return manager;
}

/**
 * A value returned from the {@link useMenuItem} hook.
 *
 * @group Components
 */
export interface HeadlessMenuItemValue {
  /**
   * Props of an element that must have a menu item behaviour.
   *
   * An object which identity never changes between renders.
   */
  menuItemProps: HTMLAttributes<HTMLElement>;

  /**
   * `true` if a menu item is currently focused.
   */
  isFocused: boolean;

  /**
   * `true` if a menu item is currently pressed.
   */
  isPressed: boolean;

  /**
   * `true` if a submenu is expanded.
   */
  isExpanded: boolean;
}

/**
 * Props of the {@link useMenuItem} hook.
 *
 * @template T A value that is passed to {@link onAction} handler.
 * @group Components
 */
export interface HeadlessMenuItemProps<T> {
  /**
   * An ID that uniquely identifies a menu item. If omitted a fallback ID is dynamically created.
   */
  id?: string;

  /**
   * A value that is passed to {@link onAction} handler.
   */
  value?: T;

  /**
   * If `true` then menu item is disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * If `true` then a menu item is {@link HeadlessMenuItemValue.isActive activated} if a user presses
   * <kbd>ArrowRight</kbd> or <kbd>ArrowLeft</kbd> to expand or collapse the submenu.
   *
   * An {@link HeadlessMenuItemValue.isActive active} menu item with a submenu is considered expanded.
   *
   * {@link onAction} is ignored for menu items that have a submenu.
   *
   * @default false
   */
  hasSubmenu?: boolean;

  /**
   * A delay in milliseconds after which a submenu is expanded.
   *
   * @default 200
   */
  expandDelay?: number;

  /**
   * A handler that is called when user presses a menu item.
   *
   * @see {@link ActionHandlerProvider}
   * @see {@link hasSubmenu}
   */
  onAction?: (value: T) => void;
}

/**
 * A single item in a {@link useMenu menu}.
 *
 * @param ref A reference to a menu item element. This must be the same element to which
 * {@link HeadlessMenuItemValue.menuItemProps} are attached.
 * @param state
 * @param props Menu item props.
 * @group Components
 */
export function useMenuItem<T>(
  ref: RefObject<FocusableElement>,
  state: HeadlessMenuState,
  props: HeadlessMenuItemProps<T> = emptyObject
): HeadlessMenuItemValue {
  const fallbackId = useUniqueId();
  const id = props.id || fallbackId;
  const [isExpanded, setExpanded] = useState(state.expandedId === id);
  const [isTabbable, setTabbable] = useState(state.tabbableId === id);
  const manager = useFunctionOnce(createMenuItemManager, setExpanded, setTabbable);

  manager.id = id;
  manager.ref = ref;
  manager.state = state;
  manager.props = props;
  manager.pressableProps.isDisabled = props.isDisabled;
  manager.handleClose = useCloseHandler();
  manager.handleAction = useActionHandler();

  const pressableValue = usePressable(ref, manager.pressableProps);
  const { value } = manager;

  value.menuItemProps = useFunctionOnce(mergeProps, pressableValue.pressableProps, manager.menuItemProps);
  value.menuItemProps.role = 'menuitem';
  value.menuItemProps['aria-disabled'] = props.isDisabled || undefined;
  value.menuItemProps.tabIndex = props.isDisabled ? undefined : isTabbable ? 0 : -1;
  value.isPressed = pressableValue.isPressed;
  value.isFocused = pressableValue.isFocused;
  value.isExpanded = isExpanded;

  useEffect(manager.onStateUpdated, [state, id]);

  return value;
}

const EXPAND_DELAY = 200;

interface MenuItemManager {
  pressableProps: PressableProps;
  menuItemProps: HTMLAttributes<HTMLElement>;
  id: string;
  ref: RefObject<FocusableElement>;
  state: HeadlessMenuState;
  props: HeadlessMenuItemProps<any>;
  value: HeadlessMenuItemValue;
  onStateUpdated: EffectCallback;
  handleClose?: () => void;
  handleAction?: (value: unknown) => void;
}

function createMenuItemManager(
  setExpanded: (isExpanded: boolean) => void,
  setTabbable: (isTabbable: boolean) => void
): MenuItemManager {
  let timer: NodeJS.Timeout;

  const expand = (): void => {
    clearTimeout(timer);

    manager.state.setExpandedId(manager.props.hasSubmenu ? manager.id : undefined);
  };

  const handleHoverChange = (isHovered: boolean): void => {
    const { expandDelay = EXPAND_DELAY } = manager.props;
    const element = manager.ref.current;

    if (isHovered) {
      manager.state.setTabbableId(manager.id);
    } else {
      manager.ref.current?.blur();
      return;
    }

    focusRing.conceal();

    if (requestFocus(element, { isScrollPrevented: true })) {
      clearTimeout(timer);
      timer = setTimeout(expand, expandDelay);
    }
  };

  const handleFocusChange = (isFocused: boolean): void => {
    const { expandDelay = EXPAND_DELAY } = manager.props;

    clearTimeout(timer);

    if (isFocused) {
      manager.state.setTabbableId(manager.id);
    }

    if (!isFocused || focusRing.isVisible) {
      // Don't expand a submenu when focused by keyboard
      return;
    }

    timer = setTimeout(expand, expandDelay);
  };

  const handlePress = (): void => {
    const { handleAction, handleClose } = manager;
    const { value, hasSubmenu, onAction } = manager.props;

    expand();

    if (hasSubmenu) {
      return;
    }

    onAction?.(value);

    handleAction?.(value);
    handleClose?.();
  };

  const handleArrowKeyDown: KeyboardEventHandler = event => {
    const { isDisabled, hasSubmenu } = manager.props;

    if (
      isDisabled ||
      !hasSubmenu ||
      event.defaultPrevented ||
      event.key !== (getTextDirection() === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
    ) {
      return;
    }

    focusRing.reveal();
    expand();
  };

  const handleStateUpdated: EffectCallback = () => {
    const unsubscribe = manager.state.subscribe(() => {
      setExpanded(manager.state.expandedId === manager.id);
      setTabbable(manager.state.tabbableId === manager.id);
    });

    const unregister = manager.state.registerId(manager.id);

    return () => {
      unsubscribe();
      unregister();
    };
  };

  const manager: MenuItemManager = {
    pressableProps: {
      onFocusChange: handleFocusChange,
      onHoverChange: handleHoverChange,
      onPress: handlePress,
    },
    menuItemProps: {
      onKeyDown: handleArrowKeyDown,
    },
    id: undefined!,
    ref: undefined!,
    state: undefined!,
    props: undefined!,
    value: {
      menuItemProps: undefined!,
      isFocused: false,
      isPressed: false,
      isExpanded: false,
    },
    onStateUpdated: handleStateUpdated,
    handleClose: undefined,
  };

  return manager;
}
