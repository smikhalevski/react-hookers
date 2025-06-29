import { FormattedInputHandler, FormattedInputState } from './useFormattedInput.js';

/**
 * Options of the {@link NumberInputHandler}.
 *
 * @group Components
 */
export interface NumberInputHandlerOptions {
  /**
   * If `true` then the handler won't allow changing the sign of the edited number.
   *
   * @default false
   */
  isSignLocked?: boolean;

  /**
   * If `true` then formatting is rendered for an `undefined` value.
   *
   * @default false
   */
  isUndefinedValueFormatted?: boolean;

  /**
   * If `true` then formatting is removed when a number is copied or cut.
   *
   * @default false
   */
  isCopyDecoded?: boolean;
}

/**
 * A state handled by the {@link NumberInputHandler}.
 *
 * @group Components
 */
export interface NumberInputState extends FormattedInputState<number | undefined> {
  /**
   * The sign of the formatted number.
   */
  sign: 1 | -1;
}

/**
 * A handler of numeric {@link useFormattedInput formatted input}.
 *
 * @example
 * const [value, setValue] = useState<number>();
 *
 * const numberInputHandler = useMemo(() => new NumberInputHandler(new Intl.NumberFormat('en')), []);
 *
 * const { inputProps } = useFormattedNumber({
 *   value,
 *   onChange: setValue,
 *   handler: numberInputHandler
 * });
 *
 * <input {...inputProps} />
 *
 * @group Components
 */
export class NumberInputHandler implements FormattedInputHandler<number | undefined, NumberInputState> {
  /**
   * The format-specific code point mappings.
   *
   * @internal
   */
  protected _encoding: NumberEncoding;

  /**
   * Handler options.
   */
  protected _options: NumberInputHandlerOptions;

  /**
   * `true` if number input supports decimal separator.
   */
  get isDecimal(): boolean {
    return this._encoding.decimalCodePoints.size !== 0;
  }

  /**
   * Creates a new {@link NumberInputHandler} instance.
   *
   * @param format The number format that handler uses to format input values.
   * @param options Handler options.
   */
  constructor(
    readonly format: Intl.NumberFormat,
    options: NumberInputHandlerOptions = {}
  ) {
    if (format.resolvedOptions().notation !== 'standard') {
      throw new Error('Unsupported number notation');
    }

    this._encoding = getNumberEncoding(format);
    this._options = options;
  }

  getInitialState(value: number | undefined): NumberInputState {
    if (typeof value === 'number' && isFinite(value)) {
      return {
        value,
        formattedValue: this.format.format(value),
        selectionStart: 0,
        selectionEnd: 0,
        sign: value < 0 || Object.is(Math.sign(value), -0) ? -1 : 1,
      };
    }

    const state: NumberInputState = {
      value: 0,
      formattedValue: '0',
      selectionStart: 0,
      selectionEnd: 1,
      sign: 1,
    };

    this.onChange(state, '', 0, 0);

    return state;
  }

  onChange(
    state: NumberInputState,
    nextFormattedValue: string,
    nextSelectionStart: number,
    nextSelectionEnd: number
  ): void {
    const encoding = this._encoding;
    const { isSignLocked } = this._options;
    const prevFormattedValue = state.formattedValue;

    // Diff range bounds from the start (i) and from the end (j) of formatted values
    let i = 0;
    let j = 0;

    while (
      i < prevFormattedValue.length &&
      i < nextFormattedValue.length &&
      i < nextSelectionStart &&
      i < state.selectionStart &&
      prevFormattedValue.charCodeAt(i) === nextFormattedValue.charCodeAt(i)
    ) {
      i++;
    }

    while (
      j < prevFormattedValue.length - i &&
      j < nextFormattedValue.length - i &&
      prevFormattedValue.charCodeAt(prevFormattedValue.length - j - 1) ===
        nextFormattedValue.charCodeAt(nextFormattedValue.length - j - 1)
    ) {
      j++;
    }

    // Deleted and inserted substrings
    const prevDiff = prevFormattedValue.substring(i, prevFormattedValue.length - j);
    const nextDiff = nextFormattedValue.substring(i, nextFormattedValue.length - j);

    // Deleted and inserted decoded chars
    let prevChars = decodeFormattedNumber(prevDiff, encoding);
    let nextChars = decodeFormattedNumber(nextDiff, encoding);

    if (isSignLocked) {
      prevChars = prevChars.replace(MINUS_SIGN_CHAR, '');
      nextChars = nextChars.replace(MINUS_SIGN_CHAR, '');
    }

    if (prevChars.length === 0 && nextChars.length === 0) {
      // Only decoration chars were affected

      if (prevDiff.length !== 0 && nextDiff.length === 0) {
        // Deleted a decoration char, move selection to the intended position
        state.selectionStart = nextSelectionStart;
        state.selectionEnd = nextSelectionEnd;
      }
      return;
    }

    if (prevChars.includes(MINUS_SIGN_CHAR) !== nextChars.includes(MINUS_SIGN_CHAR)) {
      // The minus sign presence have changed (it was either deleted or inserted)
      state.sign *= -1;
    }

    // Number chars before and after the edited substring
    let prefixChars = decodeFormattedNumber(prevFormattedValue.substring(0, i), encoding);
    let suffixChars = decodeFormattedNumber(prevFormattedValue.substring(prevFormattedValue.length - j), encoding);

    if (nextChars.includes(DECIMAL_CHAR)) {
      // A decimal separator position was changed
      prefixChars = prefixChars.replace(DECIMAL_CHAR, '');
      suffixChars = suffixChars.replace(DECIMAL_CHAR, '');
    }

    // Prefix and suffix may contain only digits and a decimal separator
    prefixChars = normalizeZeroes(prefixChars.replace(MINUS_SIGN_CHAR, '') + nextChars.replace(MINUS_SIGN_CHAR, ''));
    suffixChars = suffixChars.replace(MINUS_SIGN_CHAR, '');

    // Contains digits and a decimal separator
    let valueStr = prefixChars + suffixChars;

    if (valueStr.length === 0 && state.sign === 1 && !this._options.isUndefinedValueFormatted) {
      // Nothing to format
      state.value = undefined;
      state.formattedValue = '';
      state.selectionStart = state.selectionEnd = 0;
      return;
    }

    if (valueStr.startsWith(DECIMAL_CHAR)) {
      // Ensure a decimal number starts with a digit
      prefixChars = '0' + prefixChars;
      valueStr = '0' + valueStr;
    }

    const { value, parts } = encodeNumberValueParts(this.format, valueStr, state.sign);

    let formattedValue = '';
    let cursorPosition = 0;

    // Compose a formatted value from parts
    for (const part of parts) {
      formattedValue += part.value;
    }

    if (valueStr.length === 0) {
      // No numeric value, place the cursor where the number should start

      for (const part of parts) {
        if (part.type === 'integer') {
          break;
        }
        cursorPosition += part.value.length;
      }
    } else {
      // Cursor must be placed after the last char from prefixChars

      let prefixLength = prefixChars.length;

      for (const part of parts) {
        if (part.type === 'integer' || part.type === 'decimal' || part.type === 'fraction') {
          for (let i = 0; i < part.value.length && prefixLength !== 0; prefixLength--) {
            const codePointLength = getCodePointLength(part.value.codePointAt(i)!);

            i += codePointLength;
            cursorPosition += codePointLength;
          }
          if (prefixLength === 0) {
            break;
          }
        } else {
          cursorPosition += part.value.length;
        }
      }
    }

    state.value = value;
    state.formattedValue = formattedValue;
    state.selectionStart = state.selectionEnd = cursorPosition;
  }

  onBlur(state: NumberInputState): void {
    if (state.value === undefined) {
      state.formattedValue = '';

      if (!this._options.isSignLocked) {
        state.sign = 1;
      }
      return;
    }

    state.formattedValue = this.format.format(state.value);

    // Ensure that the value exactly matches the formatted value
    state.value =
      Math.abs(parseFloat(decodeFormattedNumber(state.formattedValue, this._encoding))) /
      state.sign /
      (this.format.resolvedOptions().style === 'percent' ? 100 : 1);
  }

  getSelectedText(state: NumberInputState): string {
    const str = state.formattedValue.substring(state.selectionStart, state.selectionEnd);

    return this._options.isCopyDecoded ? decodeFormattedNumber(str, this._encoding) : str;
  }
}

const MINUS_SIGN_CHAR = '-';
const DECIMAL_CHAR = '.';

/**
 * Removes redundant leading zeroes from an ASCII number.
 */
export function normalizeZeroes(str: string): string {
  let i = 0;

  while (i < str.length - 1 && str.charAt(i) === '0') {
    ++i;
  }
  return str.substring(i);
}

/**
 * Decodes formatted number chars as an ASCII number chars.
 *
 * @param str The formatted number.
 * @param encoding The {@link getNumberEncoding number format encoding}.
 */
export function decodeFormattedNumber(str: string, encoding: NumberEncoding): string {
  let result = '';

  for (let i = 0, codePoint; i < str.length; i += getCodePointLength(codePoint)) {
    codePoint = str.codePointAt(i)!;

    const digit = encoding.digitCodePointMap.get(codePoint);

    if (digit !== undefined) {
      result += digit;
      continue;
    }

    if (encoding.decimalCodePoints.has(codePoint)) {
      if (result.includes(DECIMAL_CHAR)) {
        // Decimal separator was already used
        break;
      }
      result += DECIMAL_CHAR;
      continue;
    }

    if (encoding.minusSignCodePoints.has(codePoint)) {
      if (result.length !== 0) {
        // Minus sign can only be used at the start of the number
        break;
      }
      result += MINUS_SIGN_CHAR;
    }
  }

  return result;
}

const numberEncodingsCache = new WeakMap<Intl.NumberFormat, NumberEncoding>();

export interface NumberEncoding {
  digitCodePointMap: ReadonlyMap<number, string>;
  decimalCodePoints: ReadonlySet<number>;
  minusSignCodePoints: ReadonlySet<number>;
}

/**
 * Returns cached number encoding for the given number format.
 */
export function getNumberEncoding(format: Intl.NumberFormat): NumberEncoding {
  let numberEncoding = numberEncodingsCache.get(format);

  if (numberEncoding === undefined) {
    const formatOptions = format.resolvedOptions();

    numberEncoding = {
      digitCodePointMap: getDigitCodePointMap(formatOptions),
      decimalCodePoints: getDecimalCodePoints(formatOptions),
      minusSignCodePoints: getMinusSignCodePoints(format, formatOptions),
    };
    numberEncodingsCache.set(format, numberEncoding);
  }

  return numberEncoding;
}

/**
 * Returns a format-specific mapping from a Unicode code point to a digit char it represents.
 */
function getDigitCodePointMap(formatOptions: Intl.ResolvedNumberFormatOptions): Map<number, string> {
  const codePointMap = new Map<number, string>();

  const decimalFormat = new Intl.NumberFormat('en', {
    numberingSystem: formatOptions.numberingSystem,
    maximumSignificantDigits: 1,
  });

  for (let i = 0; i < 10; ++i) {
    const digit = i.toString();

    codePointMap.set(48 + i, digit);
    codePointMap.set(decimalFormat.format(i).codePointAt(0)!, digit);
  }

  return codePointMap;
}

/**
 * Returns a format-specific set that contains code points of chars that denote a decimal separator in a formatted number.
 */
function getDecimalCodePoints(formatOptions: Intl.ResolvedNumberFormatOptions): Set<number> {
  const codePoints = new Set<number>();

  if (formatOptions.maximumFractionDigits === 0) {
    // Format doesn't render fractions
    return codePoints;
  }

  const decimalFormat = new Intl.NumberFormat(formatOptions.locale, {
    ...formatOptions,
    minimumSignificantDigits: undefined,
    maximumSignificantDigits: undefined,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const decimalPart = decimalFormat.formatToParts(0).find(part => part.type === 'decimal');

  if (decimalPart === undefined) {
    // No decimal part
    return codePoints;
  }

  codePoints.add(decimalPart.value.codePointAt(0)!);

  if (decimalPart.value === DECIMAL_CHAR || decimalFormat.format(1_000_000).includes(DECIMAL_CHAR)) {
    return codePoints;
  }

  // Period char can also be used as a decimal separator
  codePoints.add(46); // .

  return codePoints;
}

/**
 * Returns a format-specific set that contains code points of chars that denote a minus sign in a formatted number.
 */
function getMinusSignCodePoints(
  format: Intl.NumberFormat,
  formatOptions: Intl.ResolvedNumberFormatOptions
): Set<number> {
  const codePoints = new Set<number>();

  // Minus sign char can always be used to toggle the number sign
  codePoints.add(45); // -

  for (const part of format.formatToParts(-1)) {
    if (part.type === 'minusSign') {
      codePoints.add(part.value.codePointAt(0)!);
      continue;
    }

    // The accounting formatting may render round brackets instead of the minus sign for some languages
    if (formatOptions.currencySign === 'accounting' && formatOptions.style === 'currency' && part.value === '(') {
      codePoints.add(40); // (
      codePoints.add(41); // )
    }
  }

  return codePoints;
}

/**
 * Returns number of UTF-8 characters in a code point.
 */
function getCodePointLength(codePoint: number): number {
  return codePoint > 0xffff ? 2 : 1;
}

export interface NumberValueParts {
  value: number | undefined;
  parts: Intl.NumberFormatPart[];
}

/**
 * Formats string number to parts.
 */
export function encodeNumberValueParts(format: Intl.NumberFormat, str: string, sign: 1 | -1): NumberValueParts {
  if (str.length === 0) {
    // Render decoration only

    const parts = format.formatToParts(sign);

    // Remove parts of an actual number
    for (const part of parts) {
      if (part.type === 'integer' || part.type === 'group' || part.type === 'decimal' || part.type === 'fraction') {
        part.value = '';
      }
    }

    return { value: undefined, parts };
  }

  const formatOptions = format.resolvedOptions();

  let decimalIndex = str.indexOf(DECIMAL_CHAR);
  if (decimalIndex !== -1) {
    // Ensure that fraction doesn't overflow the maximum number of digits

    const { maximumSignificantDigits, maximumFractionDigits } = formatOptions;

    if (maximumSignificantDigits !== undefined) {
      if (decimalIndex > maximumSignificantDigits - 1) {
        // Fraction overflows maximum significant digits
        str = str.substring(0, decimalIndex);
        decimalIndex = -1;
      } else {
        // Truncate fraction
        str = str.substring(0, maximumSignificantDigits + 1);
      }
    }

    if (maximumFractionDigits !== undefined) {
      // Truncate fraction
      str = str.substring(0, decimalIndex + 1 + maximumFractionDigits);
    }
  }

  const fractionLength = decimalIndex === -1 ? 0 : Math.max(1, str.length - decimalIndex - 1);

  // The format that renders the requested number of fraction digits
  const decimalFormat = new Intl.NumberFormat(formatOptions.locale, {
    ...formatOptions,
    minimumSignificantDigits: undefined,
    maximumSignificantDigits: undefined,
    minimumFractionDigits: fractionLength,
    maximumFractionDigits: fractionLength,
  });

  const value = parseFloat(str) / sign / (formatOptions.style === 'percent' ? 100 : 1);
  const parts = decimalFormat.formatToParts(value);

  if (decimalIndex === str.length - 1) {
    // No fraction digits, remove fraction parts but keep the decimal separator

    for (const part of parts) {
      if (part.type === 'fraction') {
        part.value = '';
      }
    }
  }

  return { value, parts };
}
