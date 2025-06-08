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
  isMinusSignIgnored?: boolean;

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
   * The mapping object from a formatted number chars to an ASCII number chars.
   *
   * @internal
   */
  protected _encodingTable;

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
    const encodingTable = getEncodingTable(format, options.isMinusSignIgnored);

    if (formatOptions.notation !== 'standard') {
      throw new Error('Unsupported number notation: ' + formatOptions.notation);
    }

    this._formatOptions = formatOptions;
    this._encodingTable = encodingTable;
    this._options = options;

    this.isDecimal = encodingTable.decimalChar !== EMPTY;
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
    const encodingTable = this._encodingTable;
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
    let prevChars = decodeCharSequence(prevDiff, encodingTable);
    let nextChars = decodeCharSequence(nextDiff, encodingTable);

    if (prevChars === EMPTY && nextChars === EMPTY) {
      // Only decoration chars were affected

      if (prevDiff !== EMPTY && nextDiff === EMPTY) {
        // Deleted a decoration char, move selection to the intended position
        state.selectionStart = nextSelectionStart;
        state.selectionEnd = nextSelectionEnd;
      }
      return;
    }

    if (prevChars.includes(MINUS_SIGN) !== nextChars.includes(MINUS_SIGN)) {
      // The minus sign presence have changed (it was either deleted or inserted)
      state.isNegative = !state.isNegative;
    }

    // Number chars before and after the edited substring
    let prefixChars = decodeCharSequence(prevFormattedValue.substring(0, i), encodingTable);
    let suffixChars = decodeCharSequence(prevFormattedValue.substring(prevFormattedValue.length - j), encodingTable);

    if (nextChars.includes(DECIMAL)) {
      // A decimal separator position was changed
      prefixChars = prefixChars.replace(DECIMAL, EMPTY);
      suffixChars = suffixChars.replace(DECIMAL, EMPTY);
    }

    // Prefix and suffix may contain only digits and a decimal separator
    prefixChars = normalizeZeroes(prefixChars.replace(MINUS_SIGN, EMPTY) + nextChars.replace(MINUS_SIGN, EMPTY));
    suffixChars = suffixChars.replace(MINUS_SIGN, EMPTY);

    let valueStr = prefixChars + suffixChars;

    if (valueStr === EMPTY && !state.isNegative && !this._options.isUndefinedValueFormatted) {
      // Nothing to format
      state.value = undefined;
      state.formattedValue = EMPTY;
      state.selectionStart = state.selectionEnd = 0;
      return;
    }

    if (valueStr !== EMPTY && valueStr.charAt(0) === DECIMAL) {
      // The number must start with a digit
      prefixChars = '0' + prefixChars;
      valueStr = '0' + valueStr;
    }

    // Number of characters in a faction part of a number, or -1 if both decimal and fraction parts must be removed
    let fractionLength = -1;

    const decimalIndex = valueStr.indexOf(DECIMAL);

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

    truncateFraction(parts, fractionLength, encodingTable);

    let cursorPosition = -1;
    let formattedValue = EMPTY;

    for (const part of parts) {
      if (valueStr === EMPTY && isSignificantPart(part)) {
        if (cursorPosition === -1) {
          // Place the cursor where the number should start
          cursorPosition = formattedValue.length;
        }

        // Show only decoration when value is empty
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

      for (let i = prefixChars.length; cursorPosition < formattedValue.length; ++cursorPosition) {
        const char = decodeCharSequence(formattedValue.charAt(cursorPosition), encodingTable);

        if (char !== EMPTY) {
          maxCursorPosition = cursorPosition + 1;
        }

        if (char === EMPTY || char === MINUS_SIGN) {
          continue;
        }
        if (i === 0) {
          break;
        }
        if (--i === 0) {
          ++cursorPosition;
          break;
        }
      }

      // Prevent moving cursor past the last number char
      cursorPosition = Math.min(cursorPosition, maxCursorPosition);
    }

    // Ensure that the value is exactly equal to the formatted number
    state.value =
      valueStr === EMPTY
        ? undefined
        : Math.abs(parseFloat(decodeCharSequence(formattedValue, encodingTable))) / divider;

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

    return this._options.isCopyDecoded ? decodeCharSequence(str, this._encodingTable) : str;
  }
}

const EMPTY = '';
const MINUS_SIGN = '-';
const DECIMAL = '.';

interface EncodingTable {
  /**
   * The formatted zero number char.
   */
  zeroChar: string;

  /**
   * The formatted decimal separator char.
   */
  decimalChar: string;

  /**
   * Mapping from a formatted char to an ASCII number char.
   */
  [char: string]: string;
}

/**
 * Removes redundant leading zeroes.
 */
export function normalizeZeroes(str: string): string {
  let i = 0;

  while (i < str.length - 1 && str.charAt(i) === '0') {
    ++i;
  }
  return str.substring(i);
}

/**
 * Truncates the fraction part from `parts` to `length`.
 *
 * @param parts Formatted parts.
 * @param length The required length of the fraction part, or -1 if both decimal and fraction parts must be removed.
 * @param encodingTable The format encoding table.
 */
export function truncateFraction(parts: Intl.NumberFormatPart[], length: number, encodingTable: EncodingTable): void {
  if (length === -1) {
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
      part.value = part.value.padEnd(length, encodingTable.zeroChar).substring(0, length);
      return;
    }

    if (part.type === 'integer') {
      decimalIndex = i + 1;
    }
  }

  const decimalPart: Intl.NumberFormatPart = { type: 'decimal', value: encodingTable.decimalChar };

  if (length === 0) {
    parts.splice(decimalIndex, 0, decimalPart);
    return;
  }

  parts.splice(decimalIndex, 0, decimalPart, { type: 'fraction', value: encodingTable.zeroChar.repeat(length) });
}

/**
 * Decodes formatted number chars as an ASCII number chars.
 *
 * @param value The string that contains format encoded chars.
 * @param encodingTable The format encoding table.
 */
export function decodeCharSequence(value: string, encodingTable: EncodingTable): string {
  let str = EMPTY;

  for (let i = 0; i < value.length; ++i) {
    const char = encodingTable[value.charAt(i)];

    if (char === undefined) {
      // Decoration chars are ignored
      continue;
    }

    if ((char === MINUS_SIGN && str !== EMPTY) || (char === DECIMAL && str.includes(DECIMAL))) {
      // Unexpected minus sign or decimal separator
      break;
    }

    str += char;
  }

  return str;
}

/**
 * Returns a mapping object from a formatted number chars to an ASCII number chars.
 *
 * @param format The format from which formatted chars are inferred.
 * @param isMinusSignIgnored If `true` then characters that represent minus sign are omitted from the output mapping.
 */
export function getEncodingTable(format: Intl.NumberFormat, isMinusSignIgnored = false): EncodingTable {
  const options = format.resolvedOptions();

  const divider = options.style === 'percent' ? 100 : 1;
  const zeroChar = getEncodedChar(format, 'integer', 0 / divider);
  const decimalChar = getEncodedChar(format, 'decimal', 0.1 / divider);

  const encodingTable: EncodingTable = {
    zeroChar,
    decimalChar,

    // ASCII digits
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',

    // Localized digits
    [zeroChar]: '0',
    [getEncodedChar(format, 'integer', 1 / divider)]: '1',
    [getEncodedChar(format, 'integer', 2 / divider)]: '2',
    [getEncodedChar(format, 'integer', 3 / divider)]: '3',
    [getEncodedChar(format, 'integer', 4 / divider)]: '4',
    [getEncodedChar(format, 'integer', 5 / divider)]: '5',
    [getEncodedChar(format, 'integer', 6 / divider)]: '6',
    [getEncodedChar(format, 'integer', 7 / divider)]: '7',
    [getEncodedChar(format, 'integer', 8 / divider)]: '8',
    [getEncodedChar(format, 'integer', 9 / divider)]: '9',
  };

  if (decimalChar !== EMPTY) {
    // Fractions are supported
    encodingTable[decimalChar] = DECIMAL;

    if (decimalChar !== DECIMAL && !format.format(1e6).includes(DECIMAL)) {
      // Keep decimal dot as a separator
      encodingTable[DECIMAL] = DECIMAL;
    }
  }

  if (isMinusSignIgnored) {
    return encodingTable;
  }

  if (options.style === 'currency' && options.currencySign === 'accounting' && format.format(-1).charAt(0) === '(') {
    // Accounting uses round brackets instead of a minus sign is some locales
    encodingTable['('] = MINUS_SIGN;
    encodingTable[')'] = MINUS_SIGN;
  } else {
    encodingTable[getEncodedChar(format, 'minusSign', -1)] = MINUS_SIGN;
  }

  encodingTable[MINUS_SIGN] = MINUS_SIGN;

  return encodingTable;
}

function getEncodedChar(format: Intl.NumberFormat, type: Intl.NumberFormatPartTypes, value: number): string {
  for (const part of format.formatToParts(value)) {
    if (part.type === type) {
      return part.value;
    }
  }

  return EMPTY;
}

function isSignificantPart(part: Intl.NumberFormatPart): boolean {
  return part.type === 'integer' || part.type === 'group' || part.type === 'decimal' || part.type === 'fraction';
}
