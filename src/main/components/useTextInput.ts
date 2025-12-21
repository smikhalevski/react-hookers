import { HTMLInputAutoCompleteAttribute, InputHTMLAttributes, LabelHTMLAttributes, useId } from 'react';
import { cursor } from '../behaviors/cursor.js';
import { FocusProps, FocusValue, useFocus } from '../behaviors/useFocus.js';
import { HoverProps, HoverValue, useHover } from '../behaviors/useHover.js';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { DATA_AUTOFOCUS } from '../utils/dom.js';
import { mergeProps } from '../utils/mergeProps.js';

/**
 * A value returned from the {@link useTextInput} hook.
 *
 * @group Components
 */
export interface HeadlessTextInputValue {
  /**
   * Props for the element that implements text input behavior.
   *
   * The object identity never changes between renders.
   */
  inputProps: InputHTMLAttributes<HTMLElement>;

  /**
   * Props for the element that implements input label behavior.
   *
   * The object identity never changes between renders.
   */
  labelProps: LabelHTMLAttributes<HTMLElement>;

  /**
   * The current input text value.
   */
  value: string;

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
}

/**
 * Props for the {@link useTextInput} hook.
 *
 * @group Components
 */
export interface HeadlessTextInputProps extends HoverProps, FocusProps {
  /**
   * The input text value.
   */
  value: string | undefined;

  /**
   * A callback invoked when the input text value changes.
   *
   * @param value The new input text value.
   */
  onChange: (value: string) => void;

  /**
   * An ID that uniquely identifies the text input.
   */
  id?: string;

  /**
   * If `true`, the input is marked as invalid.
   *
   * @default false
   */
  isInvalid?: boolean;

  /**
   * If `true`, the text input is treated as a textarea element.
   *
   * @default false
   */
  isTextArea?: boolean;

  /**
   * If `true`, the element is {@link isAutoFocusable auto-focusable} within a {@link useFocusScope focus scope}.
   *
   * @default false
   */
  isAutofocused?: boolean;

  /**
   * Specifies what permission the user agent has to provide automated assistance in filling out the field,
   * and what type of information is expected.
   */
  autoComplete?: HTMLInputAutoCompleteAttribute;
}

/**
 * Provides behavior and accessibility for a text input.
 *
 * @param props Text input props.
 * @returns An object whose identity never changes between renders.
 * @group Components
 */
export function useTextInput(props: HeadlessTextInputProps): HeadlessTextInputValue {
  const hoverValue = useHover(props);
  const focusValue = useFocus(props);
  const fallbackId = useId();

  const manager = useFunctionOnce(createTextInputManager, hoverValue, focusValue);
  const { value } = manager;

  value.inputProps.id = value.labelProps.htmlFor = props.id || fallbackId;
  value.inputProps.type = props.isTextArea ? undefined : 'text';
  value.inputProps.value = value.value = props.value === undefined ? '' : props.value;
  value.inputProps.autoComplete = props.isTextArea ? undefined : props.autoComplete;
  value.inputProps['aria-disabled'] = value.inputProps.disabled = props.isDisabled || undefined;
  value.inputProps['aria-invalid'] = props.isInvalid || undefined;
  value.inputProps[DATA_AUTOFOCUS] = props.isAutofocused || undefined;
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
    const { isDisabled, onChange } = manager.props;

    if (isDisabled || event.defaultPrevented) {
      return;
    }

    // Deactivate cursor when user is typing to prevent focus from being moved to hovered element by arrow navigation
    cursor.deactivate();

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
