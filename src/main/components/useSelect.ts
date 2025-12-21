import { HTMLAttributes, LabelHTMLAttributes, useId, useState } from 'react';
import { type PressableProps, usePressable } from '../behaviors/usePressable.js';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { DATA_AUTOFOCUS } from '../utils/dom.js';
import { mergeProps } from '../utils/mergeProps.js';

/**
 * A value returned from the {@link useSelect} hook.
 *
 * @template T A selected value.
 * @group Components
 */
export interface HeadlessSelectValue<T> {
  /**
   * Props for the element that implements select trigger behavior.
   *
   * The object identity never changes between renders.
   */
  triggerProps: HTMLAttributes<HTMLElement>;

  /**
   * Props for the element that implements select label behavior.
   *
   * The object identity never changes between renders.
   */
  labelProps: LabelHTMLAttributes<HTMLElement>;

  /**
   * `true` if the select dropdown is open.
   */
  isOpened: boolean;

  /**
   * `true` if the element is currently hovered.
   */
  isHovered: boolean;

  /**
   * `true` if the element is currently focused.
   */
  isFocused: boolean;

  /**
   * `true` if the element is currently focused and focus should be visible.
   */
  isFocusVisible: boolean;

  /**
   * `true` if the element is currently pressed.
   */
  isPressed: boolean;

  /**
   * A callback that must be invoked when a value is selected.
   *
   * @param value The selected value.
   */
  onSelect: (value: T) => void;
}

/**
 * Props for the {@link useSelect} hook.
 *
 * @template T A selected value.
 * @group Components
 */
export interface HeadlessSelectProps<T> extends PressableProps {
  /**
   * The currently selected value.
   */
  value: T | undefined;

  /**
   * A callback invoked when the selected value changes.
   *
   * @param value The new selected value.
   */
  onChange: (value: T) => void;

  /**
   * A callback invoked when the open state of the select popover changes.
   *
   * @param isOpened `true` if the select popover should be visible.
   */
  onOpenChange?: (isOpened: boolean) => void;

  /**
   * An ID that uniquely identifies the select control.
   */
  id?: string;

  /**
   * If `true`, the control is marked as invalid.
   *
   * @default false
   */
  isInvalid?: boolean;

  /**
   * If `true`, the element is {@link isAutoFocusable auto-focusable} within a {@link useFocusScope focus scope}.
   *
   * @default false
   */
  isAutofocused?: boolean;
}

/**
 * Provides behavior and accessibility for a select component.
 *
 * A select displays a collapsible list of options and allows the user to select one of them.
 *
 * @param props Select props.
 * @returns An object whose identity never changes between renders.
 * @template T A selected value.
 * @group Components
 */
export function useSelect<T>(props: HeadlessSelectProps<T>): HeadlessSelectValue<T> {
  const [isOpened, setOpened] = useState(false);
  const manager = useFunctionOnce(createSelectManager<T>, setOpened);
  const fallbackId = useId();

  const pressableValue = usePressable(mergeProps(props, manager.pressableProps));
  const { value } = manager;

  value.triggerProps = pressableValue.pressableProps;
  value.triggerProps['aria-disabled'] = props.isDisabled || undefined;
  value.triggerProps['aria-invalid'] = props.isInvalid || undefined;
  value.triggerProps[DATA_AUTOFOCUS] = props.isAutofocused || undefined;
  value.labelProps.id = value.triggerProps['aria-labelledby'] = props.id || fallbackId;
  value.isOpened = isOpened;
  value.isHovered = pressableValue.isHovered;
  value.isPressed = pressableValue.isPressed;
  value.isFocused = pressableValue.isFocused;
  value.isFocusVisible = pressableValue.isFocusVisible;

  manager.props = props;

  return value;
}

interface SelectManager<T> {
  pressableProps: PressableProps;
  props: HeadlessSelectProps<T>;
  value: HeadlessSelectValue<T>;
}

function createSelectManager<T>(setOpened: (isOpened: boolean) => void): SelectManager<T> {
  const handlePress = (): void => {
    const { onOpenChange } = manager.props;

    setOpened(true);

    onOpenChange?.(true);
  };

  const handleSelect = (value: T): void => {
    manager.props.onChange(value);
  };

  const manager: SelectManager<T> = {
    pressableProps: {
      onPress: handlePress,
    },
    props: undefined!,
    value: {
      triggerProps: undefined!,
      labelProps: {},
      isOpened: false,
      isHovered: false,
      isPressed: false,
      isFocused: false,
      isFocusVisible: false,
      onSelect: handleSelect,
    },
  };

  return manager;
}
