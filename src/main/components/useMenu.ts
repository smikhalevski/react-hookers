import { EffectCallback, HTMLAttributes, KeyboardEventHandler, RefObject, useEffect, useState } from 'react';
import { focusRing } from '../behaviors/focusRing';
import { useActionHandler } from '../behaviors/useActionHandler';
import { useCloseHandler } from '../behaviors/useCloseHandler';
import { requestFocus } from '../behaviors/useFocus';
import { PressableProps, usePressable } from '../behaviors/usePressable';
import { Selection } from '../createSelection';
import { FocusableElement } from '../types';
import { useFunctionOnce } from '../useFunctionOnce';
import { useUniqueId } from '../useUniqueId';
import { emptyObject } from '../utils/lang';
import { mergeProps } from '../utils/mergeProps';

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
   * A handler that is called when a user requested to close the menu.
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
      event.key !== (document.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft') ||
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
   * `true` if a menu item is currently active.
   */
  isActive: boolean;
}

/**
 * Props of the {@link useMenuItem} hook.
 *
 * @template T A value that is passed to {@link onAction} handler.
 * @group Components
 */
export interface HeadlessMenuItemProps<T> {
  /**
   * An ID that uniquely identifies a menu item.
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
   * A delay in milliseconds after which a menu item is activated.
   *
   * @default 200
   */
  activateDelay?: number;

  /**
   * A handler that is called when user presses a menu item.
   *
   * @see {@link hasSubmenu}
   */
  onAction?: (value: T) => void;
}

/**
 * A single item in a {@link useMenu menu}.
 *
 * @param ref A reference to a menu item element. This must be the same element to which
 * {@link HeadlessMenuItemValue.menuItemProps} are attached.
 * @param selection A selection which is updated when a menu item becomes active by hover or press. All items in a menu
 * must share the same selection. Only one item can be active in the menu at a time.
 * @param props Menu item props.
 * @group Components
 */
export function useMenuItem<T>(
  ref: RefObject<FocusableElement>,
  selection: Selection,
  props: HeadlessMenuItemProps<T> = emptyObject
): HeadlessMenuItemValue {
  const fallbackId = useUniqueId();
  const id = props.id || fallbackId;
  const [isActive, setActive] = useState(selection.has(id));
  const manager = useFunctionOnce(createMenuItemManager, setActive);

  manager.id = id;
  manager.ref = ref;
  manager.selection = selection;
  manager.props = props;
  manager.pressableProps.isDisabled = props.isDisabled;
  manager.handleClose = useCloseHandler();
  manager.handleAction = useActionHandler();

  const pressableValue = usePressable(ref, manager.pressableProps);
  const { value } = manager;

  value.menuItemProps = useFunctionOnce(mergeProps, pressableValue.pressableProps, manager.menuItemProps);
  value.menuItemProps.role = 'menuitem';
  value.menuItemProps['aria-disabled'] = props.isDisabled || undefined;
  value.menuItemProps.tabIndex = props.isDisabled ? undefined : -1;
  value.isPressed = pressableValue.isPressed;
  value.isFocused = pressableValue.isFocused;
  value.isActive = isActive;

  useEffect(manager.onSelectionUpdated, [selection, id]);

  return value;
}

const ACTIVATE_DELAY = 200;

interface MenuItemManager {
  pressableProps: PressableProps;
  menuItemProps: HTMLAttributes<HTMLElement>;
  id: unknown;
  ref: RefObject<FocusableElement>;
  selection: Selection;
  props: HeadlessMenuItemProps<any>;
  value: HeadlessMenuItemValue;
  onSelectionUpdated: EffectCallback;
  handleClose?: () => void;
  handleAction?: (value: unknown) => void;
}

function createMenuItemManager(setActive: (isActive: boolean) => void): MenuItemManager {
  let timer: NodeJS.Timeout;

  const activate = (): void => {
    clearTimeout(timer);

    manager.selection.clear();
    manager.selection.add(manager.id);
  };

  const handleHoverChange = (isHovered: boolean): void => {
    const { activateDelay = ACTIVATE_DELAY } = manager.props;
    const element = manager.ref.current;

    if (!isHovered) {
      manager.ref.current?.blur();
      return;
    }

    focusRing.conceal();

    if (requestFocus(element, { isScrollPrevented: true })) {
      clearTimeout(timer);
      timer = setTimeout(activate, activateDelay);
    }
  };

  const handleFocusChange = (isFocused: boolean): void => {
    const { activateDelay = ACTIVATE_DELAY } = manager.props;

    clearTimeout(timer);

    if (!isFocused || focusRing.isVisible) {
      // Don't select an item when focused by keyboard
      return;
    }

    timer = setTimeout(activate, activateDelay);
  };

  const handlePress = (): void => {
    const { handleAction, handleClose } = manager;
    const { value, hasSubmenu, onAction } = manager.props;

    activate();

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
      event.key !== (document.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
    ) {
      return;
    }

    focusRing.reveal();
    activate();
  };

  const handleSelectionUpdated: EffectCallback = () =>
    manager.selection.subscribe(() => setActive(manager.selection.has(manager.id)));

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
    selection: undefined!,
    props: undefined!,
    value: {
      menuItemProps: undefined!,
      isFocused: false,
      isPressed: false,
      isActive: false,
    },
    onSelectionUpdated: handleSelectionUpdated,
    handleClose: undefined,
  };

  return manager;
}
