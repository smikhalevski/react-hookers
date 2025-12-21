import { PubSub } from 'parallel-universe';
import { EffectCallback, HTMLAttributes, KeyboardEventHandler, RefObject, useEffect, useId, useState } from 'react';
import { focusRing } from '../behaviors/focusRing.js';
import { useActionHandler } from '../behaviors/useActionHandler.js';
import { useCloseHandler } from '../behaviors/useCloseHandler.js';
import { requestFocus } from '../behaviors/useFocus.js';
import { PressableProps, usePressable } from '../behaviors/usePressable.js';
import { FocusableElement } from '../types.js';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { isRTLElement } from '../utils/dom.js';
import { emptyObject } from '../utils/lang.js';
import { mergeProps } from '../utils/mergeProps.js';

/**
 * A state shared by {@link useMenu} and {@link useMenuItem}.
 *
 * @group Components
 */
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
   * Props for the element that implements menu behavior.
   *
   * The object identity never changes between renders.
   */
  menuProps: HTMLAttributes<HTMLElement>;
}

/**
 * Props for the {@link useMenu} hook.
 *
 * @group Components
 */
export interface HeadlessMenuProps {
  /**
   * A callback invoked when the user requests to close the menu by pressing an arrow key.
   */
  onClose?: () => void;
}

/**
 * A menu displays a list of actions or options that a user can choose from.
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
      event.key !== (isRTLElement() ? 'ArrowRight' : 'ArrowLeft') ||
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
   * Props for the element that implements menu item behavior.
   *
   * The object identity never changes between renders.
   */
  menuItemProps: HTMLAttributes<HTMLElement>;

  /**
   * `true` if the menu item is currently focused.
   */
  isFocused: boolean;

  /**
   * `true` if the menu item is currently pressed.
   */
  isPressed: boolean;

  /**
   * `true` if a submenu is expanded.
   */
  isExpanded: boolean;
}

/**
 * Props for the {@link useMenuItem} hook.
 *
 * @template T A value passed to the {@link onAction} handler.
 * @group Components
 */
export interface HeadlessMenuItemProps<T> {
  /**
   * An ID that uniquely identifies a menu item. If omitted, a fallback ID is generated.
   */
  id?: string;

  /**
   * A value passed to the {@link onAction} handler.
   */
  value?: T;

  /**
   * If `true`, the menu item is disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * If `true`, the menu item controls a submenu and can be expanded
   * or collapsed using <kbd>ArrowRight</kbd> or <kbd>ArrowLeft</kbd>.
   *
   * An expanded menu item with a submenu is considered active.
   * {@link onAction} is ignored for menu items with a submenu.
   *
   * @default false
   */
  hasSubmenu?: boolean;

  /**
   * A delay, in milliseconds, after which a submenu is expanded.
   *
   * @default 200
   */
  expandDelay?: number;

  /**
   * A callback invoked when the user activates the menu item.
   *
   * @see {@link ActionHandlerProvider}
   * @see {@link hasSubmenu}
   */
  onAction?: (value: T) => void;
}

/**
 * A single item in a {@link useMenu menu}.
 *
 * @param ref A reference to the menu item element. This must be the same element to which
 * {@link HeadlessMenuItemValue.menuItemProps} are applied.
 * @param state Shared menu state.
 * @param props Menu item props.
 * @group Components
 */
export function useMenuItem<T>(
  ref: RefObject<FocusableElement | null>,
  state: HeadlessMenuState,
  props: HeadlessMenuItemProps<T> = emptyObject
): HeadlessMenuItemValue {
  const fallbackId = useId();
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

  const pressableValue = usePressable(manager.pressableProps);
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
  ref: RefObject<FocusableElement | null>;
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
  let timer: number;

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
      event.key !== (isRTLElement() ? 'ArrowLeft' : 'ArrowRight')
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
