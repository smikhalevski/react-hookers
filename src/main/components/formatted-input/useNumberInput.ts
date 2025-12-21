import { useMemo } from 'react';
import { FocusProps } from '../../behaviors/useFocus.js';
import { HoverProps } from '../../behaviors/useHover.js';
import { useNumberFormat } from '../../intl/useNumberFormat.js';
import { NumberInputHandler, type NumberInputHandlerOptions } from './NumberInputHandler.js';
import { type FormattedInputValue, useFormattedInput } from './useFormattedInput.js';

/**
 * Props for the {@link useNumberInput} hook.
 *
 * @group Components
 */
export interface HeadlessNumberInputProps extends NumberInputHandlerOptions, HoverProps, FocusProps {
  /**
   * The current input value.
   */
  value: number | undefined;

  /**
   * A callback invoked when the input value changes.
   *
   * @param value The new input value.
   */
  onChange?: (value: number | undefined) => void;

  /**
   * The number format to use.
   *
   * By default, a format based on the current locale is used.
   */
  format?: Intl.NumberFormat;

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
 * Provides behavior for a formatted number input.
 *
 * @example
 * const [value, setValue] = useState<number>();
 *
 * const { inputProps } = useNumberInput({
 *   value,
 *   onChange: setValue,
 * });
 *
 * <input {...inputProps} />
 *
 * @group Components
 */
export function useNumberInput(props: HeadlessNumberInputProps): FormattedInputValue<number | undefined> {
  const fallbackFormat = useNumberFormat();

  const handler = useMemo(
    () => new NumberInputHandler(props.format || fallbackFormat, props),
    [props.format, props.isSignLocked, props.isUndefinedValueFormatted, props.isCopyDecoded]
  );

  const value = useFormattedInput({ ...props, handler });

  value.inputProps.inputMode = handler.isDecimal ? 'decimal' : 'numeric';

  return value;
}
