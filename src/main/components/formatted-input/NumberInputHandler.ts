import { FormattedInputHandler, FormattedInputState } from './useFormattedInput.js';
import unicodeNumericValues from './unicode-numeric-values.js';

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
  isSignUnchangeable?: boolean;

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
   * If `true` the number should be negative.
   */
  isNegative: boolean;
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
   * Resolved options of {@link format the number format}.
   */
  protected _formatOptions;

  /**
   * The format-specific chars and code point mapping.
   *
   * @internal
   */
  protected _encoding;

  /**
   * Handler options.
   */
  protected _options: NumberInputHandlerOptions;

  /**
   * `true` if number input supports decimal separator.
   */
  readonly isDecimal;

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
    const formatOptions = format.resolvedOptions();
    const encoding = extractNumberEncoding(format, options.isSignUnchangeable);

    if (formatOptions.notation !== 'standard') {
      throw new Error('Unsupported number notation: ' + formatOptions.notation);
    }

    this._formatOptions = formatOptions;
    this._encoding = encoding;
    this._options = options;

    this.isDecimal = encoding.decimalChar !== EMPTY;
  }

  getInitialState(value: number | undefined): NumberInputState {
    if (typeof value === 'number' && isFinite(value)) {
      return {
        value,
        formattedValue: this.format.format(value),
        selectionStart: 0,
        selectionEnd: 0,
        isNegative: value < 0 || Object.is(Math.sign(value), -0),
      };
    }

    const state: NumberInputState = {
      value: 0,
      formattedValue: '0',
      selectionStart: 0,
      selectionEnd: 1,
      isNegative: false,
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
    const formatOptions = this._formatOptions;
    const encoding = this._encoding;
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
    let prevChars = decodeNumberChars(prevDiff, encoding);
    let nextChars = decodeNumberChars(nextDiff, encoding);

    if (prevChars === EMPTY && nextChars === EMPTY) {
      // Only decoration chars were affected

      if (prevDiff !== EMPTY && nextDiff === EMPTY) {
        // Deleted a decoration char, move selection to the intended position
        state.selectionStart = nextSelectionStart;
        state.selectionEnd = nextSelectionEnd;
      }
      return;
    }

    if (prevChars.includes(MINUS_SIGN_CHAR) !== nextChars.includes(MINUS_SIGN_CHAR)) {
      // The minus sign presence have changed (it was either deleted or inserted)
      state.isNegative = !state.isNegative;
    }

    // Number chars before and after the edited substring
    let prefixChars = decodeNumberChars(prevFormattedValue.substring(0, i), encoding);
    let suffixChars = decodeNumberChars(prevFormattedValue.substring(prevFormattedValue.length - j), encoding);

    if (nextChars.includes(DECIMAL_CHAR)) {
      // A decimal separator position was changed
      prefixChars = prefixChars.replace(DECIMAL_CHAR, EMPTY);
      suffixChars = suffixChars.replace(DECIMAL_CHAR, EMPTY);
    }

    // Prefix and suffix may contain only digits and a decimal separator
    prefixChars = normalizeZeroes(
      prefixChars.replace(MINUS_SIGN_CHAR, EMPTY) + nextChars.replace(MINUS_SIGN_CHAR, EMPTY)
    );
    suffixChars = suffixChars.replace(MINUS_SIGN_CHAR, EMPTY);

    let valueStr = prefixChars + suffixChars;

    if (valueStr === EMPTY && !state.isNegative && !this._options.isUndefinedValueFormatted) {
      // Nothing to format
      state.value = undefined;
      state.formattedValue = EMPTY;
      state.selectionStart = state.selectionEnd = 0;
      return;
    }

    if (valueStr !== EMPTY && valueStr.charAt(0) === DECIMAL_CHAR) {
      // The number must start with a digit
      prefixChars = '0' + prefixChars;
      valueStr = '0' + valueStr;
    }

    // Number of characters in a faction part of a number, or -1 if both decimal and fraction parts must be removed
    let fractionLength = -1;

    const decimalIndex = valueStr.indexOf(DECIMAL_CHAR);

    if (decimalIndex !== -1) {
      // Truncate fraction digits that user has entered to prevent rounding introduced by a format

      const { maximumSignificantDigits = Infinity, maximumFractionDigits = maximumSignificantDigits } = formatOptions;

      if (maximumSignificantDigits - decimalIndex > 0) {
        fractionLength = Math.min(
          maximumSignificantDigits - decimalIndex,
          maximumFractionDigits,
          valueStr.length - 1 - decimalIndex
        );
      }

      valueStr = valueStr.substring(0, decimalIndex + 1 + fractionLength);
    }

    const divider = (formatOptions.style === 'percent' ? 100 : 1) * (state.isNegative ? -1 : 1);

    const parts = this.format.formatToParts((valueStr === EMPTY ? 0 : parseFloat(valueStr)) / divider);

    truncateFraction(parts, fractionLength, encoding);

    let cursorPosition = -1;
    let formattedValue = EMPTY;

    for (const part of parts) {
      if (valueStr === EMPTY && isNotDecorationPart(part)) {
        // Strip non-decoration parts when value is empty

        if (cursorPosition === -1) {
          // Place the cursor where the number should start
          cursorPosition = formattedValue.length;
        }
        continue;
      }

      formattedValue += part.value;
    }

    if (formattedValue === EMPTY) {
      // No value
      state.value = undefined;
      state.formattedValue = EMPTY;
      state.selectionStart = state.selectionEnd = 0;
      return;
    }

    if (cursorPosition === -1) {
      // Cursor must be placed at the end of prefixChars

      cursorPosition = 0;

      let maxCursorPosition = 0;

      for (
        let i = prefixChars.length, codePoint;
        cursorPosition < formattedValue.length;
        cursorPosition += getCodePointLength(codePoint)
      ) {
        codePoint = getCodePointAt(formattedValue, cursorPosition);

        const char = decodeNumberChars(String.fromCodePoint(codePoint), encoding);

        if (char !== EMPTY) {
          maxCursorPosition = cursorPosition + getCodePointLength(codePoint);
        }

        if (char === EMPTY || char === MINUS_SIGN_CHAR) {
          continue;
        }
        if (i === 0) {
          break;
        }
        if (--i === 0) {
          cursorPosition += getCodePointLength(codePoint);
          break;
        }
      }

      // Prevent moving cursor past the last number char
      cursorPosition = Math.min(cursorPosition, maxCursorPosition);
    }

    // Ensure that the value is exactly equal to the formatted number
    state.value =
      valueStr === EMPTY ? undefined : Math.abs(parseFloat(decodeNumberChars(formattedValue, encoding))) / divider;

    state.formattedValue = formattedValue;
    state.selectionStart = state.selectionEnd = cursorPosition;
  }

  onBlur(state: NumberInputState): void {
    if (state.value === undefined) {
      state.formattedValue = EMPTY;
      state.isNegative = false;
      return;
    }

    state.formattedValue = this.format.format(state.value);
  }

  getSelectedText(state: NumberInputState): string {
    const str = state.formattedValue.substring(state.selectionStart, state.selectionEnd);

    return this._options.isCopyDecoded ? decodeNumberChars(str, this._encoding) : str;
  }
}

/**
 * Removes redundant leading zeroes from an ASCII number.
 */
export function normalizeZeroes(chars: string): string {
  let i = 0;

  while (i < chars.length - 1 && chars.charAt(i) === '0') {
    ++i;
  }
  return chars.substring(i);
}

/**
 * Truncates the fraction part from `parts` to `length`.
 *
 * @param parts Formatted parts.
 * @param length The required length of the fraction part, or -1 if both decimal and fraction parts must be removed.
 * @param encoding The number encoding.
 */
export function truncateFraction(parts: Intl.NumberFormatPart[], length: number, encoding: NumberEncoding): void {
  if (length === -1 || encoding.decimalChar === undefined) {
    // Clear decimal and fraction parts

    for (const part of parts) {
      if (part.type === 'decimal' || part.type === 'fraction') {
        part.value = EMPTY;
      }
    }
    return;
  }

  let decimalIndex = 0;

  for (let i = 0; i < parts.length; ++i) {
    const part = parts[i];

    if (part.type === 'fraction') {
      const chars = toCodePointChars(part.value, length);

      while (chars.length < length) {
        chars.push(encoding.zeroChar);
      }

      part.value = chars.join(EMPTY);
      return;
    }

    if (part.type === 'integer') {
      decimalIndex = i + 1;
    }
  }

  const decimalPart: Intl.NumberFormatPart = { type: 'decimal', value: encoding.decimalChar };

  if (length === 0) {
    parts.splice(decimalIndex, 0, decimalPart);
    return;
  }

  parts.splice(decimalIndex, 0, decimalPart, { type: 'fraction', value: encoding.zeroChar.repeat(length) });
}

/**
 * Mapping from a Unicode code point to an ASCII integer numeric value.
 */
const numericCodePoints = new Map<number, string>();

for (const entry of unicodeNumericValues) {
  for (const codePoint of entry.codePoints) {
    numericCodePoints.set(codePoint, entry.value);
  }
}

const EMPTY = '';
const MINUS_SIGN_CHAR = '-';
const DECIMAL_CHAR = '.';

export interface NumberEncoding {
  /**
   * The formatted zero digit char.
   */
  zeroChar: string;

  /**
   * The formatted decimal separator, or `undefined` if format doesn't have fraction parts.
   */
  decimalChar: string | undefined;

  /**
   * Formatted decimal separator code points.
   */
  decimalCodePoints: ReadonlySet<number>;

  /**
   * Formatted minus sign code points.
   */
  minusSignCodePoints: ReadonlySet<number>;
}

/**
 * Returns the encoding for formatted number decoding.
 */
export function extractNumberEncoding(format: Intl.NumberFormat, isSignUnchangeable = false): NumberEncoding {
  const formatOptions = format.resolvedOptions();

  const decimalCodePoints = new Set<number>();
  const minusSignCodePoints = new Set<number>();

  const zeroPart = format.formatToParts(0).find(part => part.type === 'integer');
  const zeroChar = zeroPart !== undefined ? String.fromCodePoint(getCodePointAt(zeroPart.value, 0)) : '0';

  let decimalChar;

  if (formatOptions.maximumFractionDigits !== 0) {
    const sampleValue = formatOptions.style === 'percent' ? 0.001 : 0.1;
    const decimalPart = format.formatToParts(sampleValue).find(part => part.type === 'decimal');

    if (decimalPart !== undefined) {
      decimalChar = decimalPart.value;
      decimalCodePoints.add(getCodePointAt(decimalChar, 0));

      if (decimalChar !== DECIMAL_CHAR && !format.format(1_000_000).includes(DECIMAL_CHAR)) {
        // Period can be used as a decimal separator
        decimalCodePoints.add(46); // .
      }
    }
  }

  if (!isSignUnchangeable) {
    minusSignCodePoints.add(45); // -

    for (const part of format.formatToParts(-1)) {
      if (part.type === 'minusSign') {
        minusSignCodePoints.add(getCodePointAt(part.value, 0));
        continue;
      }

      // The accounting style may use round brackets instead of the minus sign
      if (formatOptions.currencySign === 'accounting' && formatOptions.style === 'currency' && part.value === '(') {
        minusSignCodePoints.add(40); // (
        minusSignCodePoints.add(41); // )
      }
    }
  }

  return { zeroChar, decimalChar, decimalCodePoints, minusSignCodePoints };
}

/**
 * Decodes formatted number chars as an ASCII number chars.
 *
 * @param chars The string that contains format encoded chars.
 * @param encoding The number encoding.
 */
export function decodeNumberChars(chars: string, encoding: NumberEncoding): string {
  let str = EMPTY;

  for (let i = 0, codePoint; i < chars.length; i += getCodePointLength(codePoint)) {
    codePoint = getCodePointAt(chars, i);

    const value = numericCodePoints.get(codePoint);

    if (value !== undefined) {
      str += value;
      continue;
    }

    if (encoding.minusSignCodePoints.has(codePoint)) {
      if (str !== EMPTY) {
        break;
      }
      str += MINUS_SIGN_CHAR;
      continue;
    }

    if (encoding.decimalCodePoints.has(codePoint)) {
      if (str.includes(DECIMAL_CHAR)) {
        break;
      }
      str += DECIMAL_CHAR;
    }
  }

  return str;
}

function toCodePointChars(str: string, length: number): string[] {
  const chars = [];

  for (let i = 0, codePoint; i < str.length && i < length; i += getCodePointLength(codePoint)) {
    codePoint = getCodePointAt(str, i);
    chars.push(String.fromCodePoint(codePoint));
  }

  return chars;
}

function getCodePointAt(str: string, index: number): number {
  const codePoint = str.codePointAt(index);

  if (codePoint === undefined) {
    throw new Error('Reading code point out of bounds');
  }

  return codePoint;
}

function getCodePointLength(codePoint: number): number {
  return codePoint > 0xffff ? 2 : 1;
}

function isNotDecorationPart(part: Intl.NumberFormatPart): boolean {
  return part.type === 'integer' || part.type === 'group' || part.type === 'decimal' || part.type === 'fraction';
}
