import { ButtonHTMLAttributes, RefObject } from 'react';
import { useFunction } from '../useFunction';
import { PressableProps, usePressable } from '../behaviors/usePressable';

/**
 * A value returned from the {@link useButton} hook.
 *
 * @group Components
 */
export interface HeadlessButtonValue {
  /**
   * Props of an element that must have a button behaviour.
   *
   * An object which identity never changes between renders.
   */
  buttonProps: ButtonHTMLAttributes<HTMLButtonElement>;

  /**
   * `true` if an element is currently pressed.
   */
  isPressed: boolean;

  /**
   * `true` if an element is currently hovered.
   */
  isHovered: boolean;

  /**
   * `true` if an element is currently focused.
   */
  isFocused: boolean;

  /**
   * `true` if an element is currently focused and focus should be visible.
   */
  isFocusVisible: boolean;
}

/**
 * Props of the {@link useButton} hook.
 *
 * @group Components
 */
export interface HeadlessButtonProps extends PressableProps {}

/**
 * Provides the behavior and accessibility implementation for a button component. Handles mouse, keyboard, and touch
 * interactions, focus behavior, and ARIA props for both native button elements.
 *
 * @param ref A reference to a button element. This must be the same element to which
 * {@link HeadlessButtonValue.buttonProps} are attached.
 * @param props Button props.
 * @returns An object which identity never changes between renders.
 * @group Components
 */
export function useButton(ref: RefObject<HTMLButtonElement>, props: HeadlessButtonProps): HeadlessButtonValue {
  const pressableValue = usePressable(ref, props);
  const value = useFunction(createButtonValue);

  value.buttonProps = pressableValue.pressableProps;
  value.buttonProps.type = 'button';
  value.buttonProps['aria-disabled'] = value.buttonProps.disabled = props.isDisabled || undefined;
  value.buttonProps.tabIndex = props.isDisabled ? undefined : 0;
  value.isPressed = pressableValue.isPressed;
  value.isHovered = pressableValue.isHovered;
  value.isFocused = pressableValue.isFocused;
  value.isFocusVisible = pressableValue.isFocusVisible;

  return value;
}

function createButtonValue(): HeadlessButtonValue {
  return {
    buttonProps: undefined!,
    isPressed: false,
    isHovered: false,
    isFocused: false,
    isFocusVisible: false,
  };
}