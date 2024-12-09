import { EffectCallback, HTMLAttributes, KeyboardEventHandler, RefObject, useEffect, useState } from 'react';
import { focusRing } from '../behaviors/focusRing';
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
 *   const { menuProps } = useMenu(props);
 *   const selection = useFunction(createSelection, 1);
 *
 *   return (
 *     <ul {...menuProps}>
 *       <SelectionProvider value={selection}>{props.children}</SelectionProvider>
 *     </ul>
 *   );
 * }
 *
 * function MenuItem(props) {
 *   const menuItemRef = useRef(null);
 *   const { menuItemProps } = useMenuItem(menuItemRef, selection, props);
 *   const selection = useSelection();
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
  menuItemProps: HTMLAttributes<HTMLElement>;
  isActive: boolean;
  isPressed: boolean;
  isSelected: boolean;
}

/**
 * Props of the {@link useMenuItem} hook.
 *
 * @group Components
 */
export interface HeadlessMenuItemProps {
  id?: unknown;
  isDisabled?: boolean;
  hasSubmenu?: boolean;
  onAction?: () => void;
}

/**
 * A single item in a {@link useMenu menu}.
 *
 * @param ref A reference to a menu item element. This must be the same element to which
 * {@link HeadlessMenuItemValue.menuItemProps} are attached.
 * @param selection A selection which is updated when a menu item becomes selected by hover or click.
 * @param props Menu item props.
 * @group Components
 */
export function useMenuItem(
  ref: RefObject<FocusableElement>,
  selection: Selection,
  props: HeadlessMenuItemProps = emptyObject
): HeadlessMenuItemValue {
  const fallbackId = useUniqueId();
  const id = props.id || fallbackId;
  const [isSelected, setSelected] = useState(selection.has(id));
  const manager = useFunctionOnce(createMenuItemManager, setSelected);

  manager.id = id;
  manager.ref = ref;
  manager.selection = selection;
  manager.props = props;
  manager.pressableProps.isDisabled = props.isDisabled;
  manager.onClose = useCloseHandler();

  const pressableValue = usePressable(ref, manager.pressableProps);
  const { value } = manager;

  value.menuItemProps = useFunctionOnce(mergeProps, pressableValue.pressableProps, manager.menuItemProps);
  value.menuItemProps.role = 'menuitem';
  value.menuItemProps['aria-disabled'] = props.isDisabled || undefined;
  value.menuItemProps.tabIndex = props.isDisabled ? undefined : -1;
  value.isPressed = pressableValue.isPressed;
  value.isActive = pressableValue.isFocused;
  value.isSelected = isSelected;

  useEffect(manager.onSelectionUpdated, [selection, id]);

  return value;
}

const SELECT_DELAY = 200;

interface MenuItemManager {
  pressableProps: PressableProps;
  menuItemProps: HTMLAttributes<HTMLElement>;
  id: unknown;
  ref: RefObject<FocusableElement>;
  selection: Selection;
  props: HeadlessMenuItemProps;
  value: HeadlessMenuItemValue;
  onSelectionUpdated: EffectCallback;
  onClose?: () => void;
}

function createMenuItemManager(setSelected: (isSelected: boolean) => void): MenuItemManager {
  let timer: NodeJS.Timeout;

  const select = (): void => {
    clearTimeout(timer);

    manager.selection.add(manager.id);
  };

  const handleHoverChange = (isHovered: boolean): void => {
    const element = manager.ref.current;

    if (!isHovered) {
      manager.ref.current?.blur();
      return;
    }

    focusRing.conceal();
    requestFocus(element, { isScrollPrevented: true });

    clearTimeout(timer);
    timer = setTimeout(select, SELECT_DELAY);
  };

  const handleFocusChange = (isFocused: boolean): void => {
    clearTimeout(timer);

    if (!isFocused || focusRing.isVisible) {
      // Don't select an item when focused by keyboard
      return;
    }

    timer = setTimeout(select, SELECT_DELAY);
  };

  const handlePress = (): void => {
    const { onClose } = manager;
    const { hasSubmenu, onAction } = manager.props;

    select();

    if (hasSubmenu) {
      return;
    }

    onAction?.();
    onClose?.();
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
    select();
  };

  const handleSelectionUpdated: EffectCallback = () =>
    manager.selection.subscribe(() => setSelected(manager.selection.has(manager.id)));

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
      isActive: false,
      isPressed: false,
      isSelected: false,
    },
    onSelectionUpdated: handleSelectionUpdated,
    onClose: undefined,
  };

  return manager;
}
