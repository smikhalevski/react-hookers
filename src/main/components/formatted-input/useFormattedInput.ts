import {
  ClipboardEventHandler,
  CompositionEventHandler,
  FocusEventHandler,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactEventHandler,
  SyntheticEvent,
  useId,
} from 'react';
import { FocusProps, type FocusValue, useFocus } from '../../behaviors/useFocus.js';
import { HoverProps, type HoverValue, useHover } from '../../behaviors/useHover.js';
import { useRerender } from '../../useRerender.js';
import { useFunction } from '../../useFunction.js';
import { DATA_AUTOFOCUS } from '../../utils/dom.js';
import { isEqual } from '../../utils/lang.js';
import { mergeProps } from '../../utils/mergeProps.js';

/**
 * The state of a {@link useFormattedInput formatted input}.
 *
 * @template V An input value.
 * @see {@link useFormattedInput}
 * @group Components
 */
export interface FormattedInputState<V> {
  /**
   * The value exposed by the input.
   */
  value: V;

  /**
   * The formatted value rendered in the input.
   */
  formattedValue: string;

  /**
   * The character index in {@link formattedValue} where the selected range starts (inclusive).
   */
  selectionStart: number;

  /**
   * The character index in {@link formattedValue} where the selected range ends (exclusive).
   */
  selectionEnd: number;
}

/**
 * A handler that updates state in response to various input events.
 *
 * @template V An input value.
 * @template S A mutable state of a formatted input.
 * @see {@link useFormattedInput}
 * @group Components
 */
export interface FormattedInputHandler<V, S extends FormattedInputState<V> = FormattedInputState<V>> {
  /**
   * Returns the initial mutable state of a formatted input corresponding to the given value.
   *
   * @param value A value provided to {@link useFormattedInput}.
   */
  getInitialState(value: V): S;

  /**
   * Updates the state after the user changes the formatted value.
   *
   * @param state The state of the input before the formatted value change.
   * @param nextFormattedValue The new formatted value.
   * @param nextSelectionStart The new start of the text selection.
   * @param nextSelectionEnd The new end of the text selection.
   */
  onChange(state: S, nextFormattedValue: string, nextSelectionStart: number, nextSelectionEnd: number): void;

  /**
   * Updates the state after the text selection changes.
   *
   * By default, the state is updated with the new selection range.
   *
   * @param state The state of the input before the selection change.
   * @param nextSelectionStart The new start of the text selection.
   * @param nextSelectionEnd The new end of the text selection.
   */
  onSelect?(state: S, nextSelectionStart: number, nextSelectionEnd: number): void;

  /**
   * Updates the state when the input is focused. No-op by default.
   *
   * @param state The current state of the input.
   */
  onFocus?(state: S): void;

  /**
   * Updates the state when the input is blurred. No-op by default.
   *
   * @param state The current state of the input.
   */
  onBlur?(state: S): void;

  /**
   * Returns the selected text.
   *
   * Called when text is copied or cut from a formatted input.
   * By default, a substring of {@link FormattedInputState.formattedValue the formatted value} is used.
   *
   * @param state The current state of the input.
   * @returns The selected text.
   */
  getSelectedText?(state: S): string;
}

/**
 * A value returned from the {@link useFormattedInput} hook.
 *
 * @group Components
 */
export interface FormattedInputValue<V> {
  /**
   * Props for the element that implements the formatted input behavior.
   *
   * The object identity never changes between renders.
   */
  inputProps: InputHTMLAttributes<HTMLInputElement>;

  /**
   * Props for the element that implements the input label behavior.
   *
   * The object identity never changes between renders.
   */
  labelProps: LabelHTMLAttributes<HTMLElement>;

  /**
   * The current edited value.
   */
  value: V;

  /**
   * The formatted value rendered in the input.
   */
  formattedValue: string;

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
 * Props for the {@link useFormattedInput} hook.
 *
 * @template V An input value.
 * @group Components
 */
export interface FormattedInputProps<V> extends HoverProps, FocusProps {
  /**
   * A handler that updates state in response to various input events.
   */
  handler: FormattedInputHandler<V, any>;

  /**
   * The input value.
   */
  value: V;

  /**
   * A callback invoked when the input value changes.
   *
   * @param value The new input value.
   */
  onChange?: (value: V) => void;

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
   * If `true`, the element is {@link isAutoFocusable auto-focusable} within a {@link useFocusScope focus scope}.
   *
   * @default false
   */
  isAutofocused?: boolean;
}

/**
 * Provides behavior for a text input that allows editing a value as formatted text.
 *
 * @example
 * const [value, setValue] = useState<number>();
 *
 * const numberInputHandler = useMemo(
 *   () => new NumberInputHandler(new Intl.NumberFormat('en')),
 *   []
 * );
 *
 * const { inputProps } = useFormattedNumber({
 *   value,
 *   onChange: setValue,
 *   handler: numberInputHandler,
 * });
 *
 * <input {...inputProps} />
 *
 * @template V An input value.
 * @group Components
 */
export function useFormattedInput<V>(props: FormattedInputProps<V>): FormattedInputValue<V> {
  const hoverValue = useHover(props);
  const focusValue = useFocus(props);
  const fallbackId = useId();
  const rerender = useRerender();
  const manager = useFunction(createFormattedInputManager<V>, rerender, hoverValue, focusValue);
  const { value } = manager;

  manager.updateProps(props);

  value.inputProps.id = value.labelProps.htmlFor = props.id || fallbackId;
  value.inputProps.type = 'text';
  value.inputProps.autoComplete = 'off';
  value.inputProps['aria-disabled'] = value.inputProps.disabled = props.isDisabled || undefined;
  value.inputProps['aria-invalid'] = props.isInvalid || undefined;
  value.inputProps[DATA_AUTOFOCUS] = props.isAutofocused || undefined;
  value.isHovered = hoverValue.isHovered;
  value.isFocused = focusValue.isFocused;
  value.isFocusVisible = focusValue.isFocusVisible;

  return manager.value;
}

interface FormattedInputManager<V> {
  value: FormattedInputValue<V>;

  updateProps(props: FormattedInputProps<V>): void;
}

function createFormattedInputManager<V>(
  rerender: () => void,
  hoverValue: HoverValue,
  focusValue: FocusValue
): FormattedInputManager<V> {
  let props: FormattedInputProps<V>;
  let state: FormattedInputState<V>;
  let isComposing = false;

  let composedValue = '';

  const updateProps = (nextProps: FormattedInputProps<V>): void => {
    if (props === undefined || props.handler !== nextProps.handler || !isEqual(state.value, nextProps.value)) {
      state = nextProps.handler.getInitialState(nextProps.value);
    }

    const { value } = manager;

    value.inputProps.value = isComposing ? composedValue : state.formattedValue;
    value.value = state.value;
    value.formattedValue = state.formattedValue;

    props = nextProps;
  };

  /**
   * Calls an action and re-renders the component if there were state changes.
   */
  const applyAction = (
    event: SyntheticEvent<HTMLInputElement>,
    action: (formattedValue: string, selectionStart: number, selectionEnd: number) => void
  ): void => {
    const target = event.currentTarget;
    const { onChange, isDisabled } = props;
    const { selectionStart, selectionEnd } = target;

    if (isDisabled || selectionStart === null || selectionEnd === null) {
      return;
    }

    const prevState = state;
    const prevValue = prevState.value;
    const prevFormattedValue = prevState.formattedValue;

    action(target.value, selectionStart, selectionEnd);

    if (!isEqual(prevValue, state.value) && onChange !== undefined) {
      onChange(state.value);
    } else if (prevFormattedValue !== state.formattedValue) {
      rerender();
    }

    if (state !== prevState) {
      // Action was superseded
      return;
    }

    queueMicrotask(() =>
      target.setSelectionRange(state.selectionStart, state.selectionEnd, target.selectionDirection || 'none')
    );
  };

  const handleChange: ReactEventHandler<HTMLInputElement> = event => {
    if (isComposing) {
      composedValue = event.currentTarget.value;
      rerender();
      return;
    }

    applyAction(event, (formattedValue, selectionStart, selectionEnd) => {
      props.handler.onChange(state, formattedValue, selectionStart, selectionEnd);
    });
  };

  const handleSelect: ReactEventHandler<HTMLInputElement> = event => {
    if (isComposing) {
      return;
    }

    applyAction(event, (_formattedValue, selectionStart, selectionEnd) => {
      if (props.handler.onSelect === undefined) {
        state.selectionStart = selectionStart;
        state.selectionEnd = selectionEnd;
        return;
      }

      props.handler.onSelect(state, selectionStart, selectionEnd);
    });
  };

  const handleFocus: FocusEventHandler<HTMLInputElement> = event => {
    if (props.handler.onFocus === undefined) {
      // No-op
      return;
    }
    applyAction(event, () => props.handler.onFocus!(state));
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = event => {
    if (props.handler.onBlur === undefined) {
      // No-op
      return;
    }
    applyAction(event, () => props.handler.onBlur!(state));
  };

  const handleCopy: ClipboardEventHandler<HTMLInputElement> = event => {
    if (props.handler.getSelectedText === undefined) {
      // Allow the default browser behavior
      return;
    }

    event.clipboardData.setData('text/plain', props.handler.getSelectedText(state));
    event.preventDefault();
  };

  const handleCut: ClipboardEventHandler<HTMLInputElement> = event => {
    if (props.handler.getSelectedText === undefined) {
      // Allow the default browser behavior
      return;
    }

    event.clipboardData.setData('text/plain', props.handler.getSelectedText(state));
    event.preventDefault();

    // Preventing the default behaviour also prevents the change event, so it must be emulated
    applyAction(event, (formattedValue, selectionStart, selectionEnd) => {
      formattedValue = formattedValue.substring(0, selectionStart) + formattedValue.substring(selectionEnd);

      props.handler.onChange(state, formattedValue, selectionStart, selectionStart);
    });
  };

  const handleCompositionStart: CompositionEventHandler<HTMLInputElement> = _event => {
    isComposing = true;
  };

  const handleCompositionEnd: CompositionEventHandler<HTMLInputElement> = event => {
    isComposing = false;
    composedValue = '';
    handleChange(event);
  };

  const manager: FormattedInputManager<V> = {
    value: {
      inputProps: mergeProps(hoverValue.hoverProps, focusValue.focusProps, {
        onChange: handleChange,
        onSelect: handleSelect,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onCopy: handleCopy,
        onCut: handleCut,
        onCompositionStart: handleCompositionStart,
        onCompositionEnd: handleCompositionEnd,
      }),
      labelProps: {},
      value: undefined!,
      formattedValue: '',
      isHovered: false,
      isFocused: false,
      isFocusVisible: false,
    },
    updateProps,
  };

  return manager;
}
