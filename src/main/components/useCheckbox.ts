import { InputHTMLAttributes, LabelHTMLAttributes, useId } from 'react';
import { FocusProps, FocusValue, useFocus } from '../behaviors/useFocus.js';
import { HoverProps, HoverValue, useHover } from '../behaviors/useHover.js';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { DATA_AUTOFOCUS } from '../utils/dom.js';
import { mergeProps } from '../utils/mergeProps.js';

/**
 * A value returned from the {@link useCheckbox} hook.
 *
 * @group Components
 */
export interface HeadlessCheckboxValue {
  /**
   * Props of an element that must have a checkbox behavior.
   *
   * An object which identity never changes between renders.
   */
  inputProps: InputHTMLAttributes<HTMLInputElement>;

  /**
   * Props of an element that must have a checkbox label behavior.
   *
   * An object which identity never changes between renders.
   */
  labelProps: LabelHTMLAttributes<HTMLLabelElement>;

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
 * Props of the {@link useCheckbox} hook.
 *
 * @group Components
 */
export interface HeadlessCheckboxProps extends HoverProps, FocusProps {
  /**
   * If `true` then a checkbox is checked.
   *
   * @default false
   */
  isChecked?: boolean;

  /**
   * A handler that is called when a checkbox is checked or unchecked.
   *
   * @param isChecked `true` if checkbox is checked.
   */
  onChange?: (isChecked: boolean) => void;

  /**
   * An ID that uniquely identifies a checkbox.
   */
  id?: string;

  /**
   * If `true` then a checkbox is marked as invalid.
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
 * Provides the behavior and accessibility implementation for a checkbox component. Checkboxes allow users to select
 * multiple items from a list of individual items, or to mark one individual item as selected.
 *
 * @param props Checkbox props.
 * @group Components
 */
export function useCheckbox(props: HeadlessCheckboxProps): HeadlessCheckboxValue {
  const hoverValue = useHover(props);
  const focusValue = useFocus(props);
  const fallbackId = useId();

  const manager = useFunctionOnce(createCheckboxManager, hoverValue, focusValue);
  const { value } = manager;

  value.inputProps.id = value.labelProps.htmlFor = props.id || fallbackId;
  value.inputProps.checked = props.isChecked || false;
  value.inputProps['aria-disabled'] = value.inputProps.disabled = props.isDisabled || undefined;
  value.inputProps['aria-invalid'] = props.isInvalid || undefined;
  value.inputProps[DATA_AUTOFOCUS] = props.isAutofocused || undefined;
  value.isHovered = hoverValue.isHovered;
  value.isFocused = focusValue.isFocused;
  value.isFocusVisible = focusValue.isFocusVisible;

  manager.props = props;

  return value;
}

interface CheckboxManager {
  props: HeadlessCheckboxProps;
  value: HeadlessCheckboxValue;
}

function createCheckboxManager(hoverValue: HoverValue, focusValue: FocusValue): CheckboxManager {
  const inputProps: InputHTMLAttributes<HTMLInputElement> = mergeProps(hoverValue.hoverProps, focusValue.focusProps);

  inputProps.type = 'checkbox';

  inputProps.onChange = event => {
    const { isDisabled, onChange } = manager.props;

    if (isDisabled || event.defaultPrevented) {
      return;
    }

    onChange?.(event.currentTarget.checked);
  };

  const manager: CheckboxManager = {
    props: undefined!,
    value: {
      inputProps,
      labelProps: hoverValue.hoverProps,
      isHovered: false,
      isFocused: false,
      isFocusVisible: false,
    },
  };

  return manager;
}
