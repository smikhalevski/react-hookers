import { useMemo } from 'react';
import { FocusProps } from '../../behaviors/useFocus.js';
import { HoverProps } from '../../behaviors/useHover.js';
import { useNumberFormat } from '../../intl/useNumberFormat.js';
import { NumberInputHandler, type NumberInputHandlerOptions } from './NumberInputHandler.js';
import { type FormattedInputValue, useFormattedInput } from './useFormattedInput.js';

/**
 * Props of the {@link useNumberInput} hook.
 *
 * @group Components
 */
export interface HeadlessNumberInputProps extends NumberInputHandlerOptions, HoverProps, FocusProps {
  /**
   * The current input value.
   */
  value: number | undefined;

  /**
   * A handler that is called when an input value is changed.
   *
   * @param value An input value.
   */
  onChange?: (value: number | undefined) => void;

  /**
   * A number format. By default, a format that uses the current locale.
   */
  format?: Intl.NumberFormat;

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
   * If `true` then element is {@link isAutoFocusable auto-focusable} inside a {@link useFocusScope focus scope}.
   *
   * @default false
   */
  isAutofocused?: boolean;
}

/**
 * Provides the behavior for a formatted number input.
 *
 * @example
 * const [value, setValue] = useState<number>();
 *
 * const { inputProps } = useNumberInput({ value, onChange: setValue });
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
