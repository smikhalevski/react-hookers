import { HTMLAttributes, LabelHTMLAttributes, RefObject, useState } from 'react';
import { type PressableProps, usePressable } from '../behaviors/usePressable';
import { useFunctionOnce } from '../useFunctionOnce';
import { useUniqueId } from '../useUniqueId';
import { DATA_AUTOFOCUS } from '../utils/dom';
import { mergeProps } from '../utils/mergeProps';

/**
 * A value returned from the {@link useSelect} hook.
 *
 * @template T A selected value.
 * @group Components
 */
export interface HeadlessSelectValue<T> {
  /**
   * Props of an element that must have a select trigger behaviour.
   *
   * An object which identity never changes between renders.
   */
  triggerProps: HTMLAttributes<HTMLElement>;

  /**
   * Props of an element that must have a select label behaviour.
   *
   * An object which identity never changes between renders.
   */
  labelProps: LabelHTMLAttributes<HTMLElement>;

  /**
   * `true` if a select dropdown is opened.
   */
  isOpened: boolean;

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

  /**
   * `true` if an element is currently pressed.
   */
  isPressed: boolean;

  /**
   * A handler that must be called when a value is selected.
   *
   * @param value A selected value.
   */
  onSelect: (value: T) => void;
}

/**
 * Props of the {@link useSelect} hook.
 *
 * @template T A selected value.
 * @group Components
 */
export interface HeadlessSelectProps<T> extends PressableProps {
  /**
   * A selected value.
   */
  value: T | undefined;

  /**
   * A handled that is called when selected value is changed.
   *
   * @param value A new selected value.
   */
  onChange: (value: T) => void;

  /**
   * A handler that is called when a select popover opened state is changed.
   *
   * @param isOpened `true` if a select popover must be visible to a user.
   */
  onOpenChange?: (isOpened: boolean) => void;

  /**
   * An ID that uniquely identifies a text input.
   */
  id?: string;

  /**
   * If `true` then a control is marked as invalid.
   *
   * @default false
   */
  isInvalid?: boolean;

  /**
   * If `true` then element is {@link isAutoFocusable auto-focusable} inside a {@link useFocusScope focus scope}.
   *
   * @default false
   */
  isAutofocused?: boolean;
}

/**
 * Provides the behavior and accessibility implementation for a select component. A select displays a collapsible list
 * of options and allows a user to select one of them.
 *
 * @param ref A reference to a select trigger element that opens and closes a select dropdown. This must be the same
 * element to which {@link HeadlessSelectValue.triggerProps} are attached.
 * @param props Select props.
 * @returns An object which identity never changes between renders.
 * @template T A selected value.
 * @group Components
 */
export function useSelect<T>(ref: RefObject<Element>, props: HeadlessSelectProps<T>): HeadlessSelectValue<T> {
  const [isOpened, setOpened] = useState(false);
  const manager = useFunctionOnce(createSelectManager<T>, setOpened);
  const fallbackId = useUniqueId();

  const pressableValue = usePressable(ref, mergeProps(props, manager.pressableProps));
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
