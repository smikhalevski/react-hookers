import { InputHTMLAttributes, LabelHTMLAttributes, RefObject } from 'react';
import { mergeProps } from './mergeProps';
import { FocusProps, FocusValue, useFocus } from './useFocus';
import { useFunction } from './useFunction';
import { HoverProps, HoverValue, useHover } from './useHover';
import { useUniqueId } from './useUniqueId';

/**
 * A value returned from the {@link useTextInput} hook.
 */
export interface HeadlessTextInputValue {
  /**
   * Props of an element that must have a text input behaviour.
   *
   * An object which identity never changes between renders.
   */
  inputProps: InputHTMLAttributes<HTMLElement>;

  /**
   * Props of an element that must have a text button label behaviour.
   *
   * An object which identity never changes between renders.
   */
  labelProps: LabelHTMLAttributes<HTMLElement>;

  /**
   * An input text value.
   */
  value: string;

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
 * Props of the {@link useTextInput} hook.
 */
export interface HeadlessTextInputProps extends HoverProps, FocusProps {
  /**
   * An input text value.
   */
  value: string | undefined;

  /**
   * A handler that is called when an input text value is changed.
   *
   * @param value An input text value.
   */
  onChange: (value: string) => void;

  /**
   * An ID that uniquely identifies a text input.
   */
  id?: string;

  /**
   * If `true` then an input is marked as invalid.
   *
   * @default false
   */
  isInvalid?: boolean;

  /**
   * If `true` then a text input is treated as a textarea element.
   *
   * @default false
   */
  isTextArea?: boolean;
}

/**
 * Provides the behavior and accessibility implementation for a text input.
 *
 * @param ref A reference to a textarea or input element. This must be the same element to which
 * {@link HeadlessTextInputValue.inputProps} are attached.
 * @param props Text input props.
 * @returns An object which identity never changes between renders.
 */
export function useTextInput(ref: RefObject<HTMLInputElement>, props: HeadlessTextInputProps): HeadlessTextInputValue {
  const hoverValue = useHover(props);
  const focusValue = useFocus(ref, props);
  const fallbackId = useUniqueId();

  const manager = useFunction(createTextInputManager, hoverValue, focusValue);
  const { value } = manager;

  value.inputProps.id = value.labelProps.htmlFor = props.id || fallbackId;
  value.inputProps.type = props.isTextArea ? undefined : 'text';
  value.inputProps.value = value.value = props.value === undefined ? '' : props.value;
  value.inputProps['aria-disabled'] = value.inputProps.disabled = props.isDisabled || undefined;
  value.inputProps['aria-invalid'] = props.isInvalid || undefined;
  value.isHovered = hoverValue.isHovered;
  value.isFocused = focusValue.isFocused;
  value.isFocusVisible = focusValue.isFocusVisible;

  manager.props = props;

  return value;
}

interface TextInputManager {
  props: HeadlessTextInputProps;
  value: HeadlessTextInputValue;
}

function createTextInputManager(hoverValue: HoverValue, focusValue: FocusValue): TextInputManager {
  const inputProps: InputHTMLAttributes<HTMLInputElement> = mergeProps(hoverValue.hoverProps, focusValue.focusProps);

  inputProps.onChange = event => {
    const { onChange } = manager.props;

    onChange?.(event.currentTarget.value);
  };

  const manager: TextInputManager = {
    props: undefined!,
    value: {
      inputProps,
      labelProps: {},
      value: '',
      isHovered: false,
      isFocused: false,
      isFocusVisible: false,
    },
  };

  return manager;
}
