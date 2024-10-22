import { DOMAttributes, RefObject } from 'react';
import { mergeProps } from '../utils/mergeProps';
import { FocusProps, FocusValue, useFocus } from './useFocus';
import { useFunction } from '../useFunction';
import { HoverProps, HoverValue, useHover } from './useHover';
import { PressProps, PressValue, usePress } from './usePress';
import { emptyObject } from '../utils/lang';

/**
 * A value returned from the {@link usePressable} hook.
 *
 * @group Behaviors
 */
export interface PressableValue {
  /**
   * Props of an element for which pressable events are tracked.
   *
   * An object which identity never changes between renders.
   */
  pressableProps: DOMAttributes<Element>;

  /**
   * `true` if an element is currently hovered.
   */
  isHovered: boolean;

  /**
   * `true` if an element is currently pressed.
   */
  isPressed: boolean;

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
 * Props of the {@link usePressable} hook.
 *
 * @group Behaviors
 */
export interface PressableProps extends HoverProps, PressProps, FocusProps {}

/**
 * Handles hover, focus and press interactions across mouse, touch, keyboard, and screen readers.
 *
 * This hook is a combination of {@link useHover}, {@link usePress} and {@link useFocus} hooks.
 *
 * @param ref A reference to a pressable element. This must be the same element to which
 * {@link PressableValue.pressableProps} are attached.
 * @param props Pressable props.
 * @returns An object which identity never changes between renders.
 * @group Behaviors
 */
export function usePressable(ref: RefObject<Element>, props: PressableProps = emptyObject): PressableValue {
  const hoverValue = useHover(props);
  const pressValue = usePress(props);
  const focusValue = useFocus(ref, props);
  const value = useFunction(createPressableValue, hoverValue, pressValue, focusValue);

  value.isHovered = hoverValue.isHovered;
  value.isPressed = pressValue.isPressed;
  value.isFocused = focusValue.isFocused;
  value.isFocusVisible = focusValue.isFocusVisible;

  return value;
}

function createPressableValue(hoverValue: HoverValue, pressValue: PressValue, focusValue: FocusValue): PressableValue {
  return {
    pressableProps: mergeProps(hoverValue.hoverProps, pressValue.pressProps, focusValue.focusProps),
    isHovered: false,
    isPressed: false,
    isFocused: false,
    isFocusVisible: false,
  };
}
