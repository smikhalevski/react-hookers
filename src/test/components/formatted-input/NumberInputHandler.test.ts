import { describe, expect, test } from 'vitest';
import {
  decodeNumericChars,
  encodeNumericChars,
  getNumberEncoding,
  normalizeZeroes,
  type NumberEncoding,
  NumberInputHandler,
  NumberInputState,
  type NumberValueParts,
} from '../../../main/components/formatted-input/NumberInputHandler.js';

describe('NumberInputHandler', () => {
  describe('new', () => {
    test('throws if notation is unsupported', () => {
      expect(() => new NumberInputHandler(new Intl.NumberFormat('en', { notation: 'compact' }))).toThrow(
        new Error('Unsupported number notation')
      );
    });
  });

  describe('getInitialState', () => {
    test('returns state for an undefined value', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(undefined)).toStrictEqual({
        value: undefined,
        formattedValue: '',
        selectionStart: 0,
        selectionEnd: 0,
        sign: 1,
      });
    });

    test('returns state for a non-finite value', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(NaN)).toStrictEqual({
        value: undefined,
        formattedValue: '',
        selectionStart: 0,
        selectionEnd: 0,
        sign: 1,
      });

      expect(handler.getInitialState(Infinity)).toStrictEqual({
        value: undefined,
        formattedValue: '',
        selectionStart: 0,
        selectionEnd: 0,
        sign: 1,
      });
    });

    test('returns state for negative value', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(-1000)).toStrictEqual({
        value: -1000,
        formattedValue: '-1,000',
        selectionStart: 0,
        selectionEnd: 0,
        sign: -1,
      });
    });

    test('returns state for positive value', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(1000)).toStrictEqual({
        value: 1000,
        formattedValue: '1,000',
        selectionStart: 0,
        selectionEnd: 0,
        sign: 1,
      });
    });

    test('returns state for zero', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(0)).toStrictEqual({
        value: 0,
        formattedValue: '0',
        selectionStart: 0,
        selectionEnd: 0,
        sign: 1,
      });
    });

    test('returns state for negative zero', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(-0)).toStrictEqual({
        value: -0,
        formattedValue: '-0',
        selectionStart: 0,
        selectionEnd: 0,
        sign: -1,
      });
    });

    test('formats undefined value', () => {
      const format = new Intl.NumberFormat('zh-Hans-CN-u-nu-hanidec', {
        style: 'currency',
        currencySign: 'accounting',
        currency: 'USD',
      });

      const handler = new NumberInputHandler(format, { isUndefinedValueFormatted: true });

      expect(handler.getInitialState(undefined)).toStrictEqual({
        value: undefined,
        formattedValue: 'US$',
        selectionEnd: 3,
        selectionStart: 3,
        sign: 1,
      });
    });
  });

  describe('onChange', () => {
    test('formats a value', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      const state: NumberInputState = {
        value: undefined,
        formattedValue: '',
        selectionStart: 0,
        selectionEnd: 0,
        sign: 1,
      };

      handler.onChange(state, '1', 1, 1);

      expect(state).toStrictEqual({
        value: 1,
        formattedValue: '1',
        selectionEnd: 1,
        selectionStart: 1,
        sign: 1,
      });
    });

    test('replaces a substring', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      const state: NumberInputState = {
        value: 1000,
        formattedValue: '1,000',
        selectionStart: 2,
        selectionEnd: 4,
        sign: 1,
      };

      handler.onChange(state, '333', 2, 4);

      expect(state).toStrictEqual({
        value: 333,
        formattedValue: '333',
        selectionEnd: 3,
        selectionStart: 3,
        sign: 1,
      });
    });

    test('formats a minus sign', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      const state: NumberInputState = {
        value: undefined,
        formattedValue: '',
        selectionStart: 0,
        selectionEnd: 0,
        sign: 1,
      };

      handler.onChange(state, '-', 1, 1);

      expect(state).toStrictEqual({
        value: undefined,
        formattedValue: '-',
        selectionEnd: 1,
        selectionStart: 1,
        sign: -1,
      });
    });

    test('formats a negative value with accounting currencySign', () => {
      const handler = new NumberInputHandler(
        new Intl.NumberFormat('en', { style: 'currency', currency: 'usd', currencySign: 'accounting' })
      );

      const state: NumberInputState = {
        value: undefined,
        formattedValue: '',
        selectionStart: 0,
        selectionEnd: 0,
        sign: 1,
      };

      handler.onChange(state, '-', 1, 1);

      expect(state).toStrictEqual({
        value: undefined,
        formattedValue: '($)',
        selectionEnd: 2,
        selectionStart: 2,
        sign: -1,
      });
    });

    test('negates positive value with minus sign', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      const state: NumberInputState = {
        value: 1000,
        formattedValue: '1,000',
        selectionStart: 1,
        selectionEnd: 1,
        sign: 1,
      };

      handler.onChange(state, '1-,000', 2, 2);

      expect(state).toStrictEqual({
        value: -1000,
        formattedValue: '-1,000',
        selectionEnd: 2,
        selectionStart: 2,
        sign: -1,
      });
    });

    test('negates negative value with minus sign', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      const state: NumberInputState = {
        value: -1000,
        formattedValue: '-1,000',
        selectionStart: 2,
        selectionEnd: 2,
        sign: -1,
      };

      handler.onChange(state, '-1,-000', 4, 4);

      expect(state).toStrictEqual({
        value: 1000,
        formattedValue: '1,000',
        selectionEnd: 1,
        selectionStart: 1,
        sign: 1,
      });
    });

    test('formats decimal separator', () => {
      const handler = new NumberInputHandler(
        new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      );

      const state: NumberInputState = {
        value: undefined,
        formattedValue: '',
        selectionStart: 0,
        selectionEnd: 0,
        sign: -1,
      };

      handler.onChange(state, '.', 1, 1);

      expect(state).toStrictEqual({
        value: -0,
        formattedValue: '-0.',
        selectionEnd: 3,
        selectionStart: 3,
        sign: -1,
      });
    });

    test('preserves decimal separator when fraction is zero', () => {
      const handler = new NumberInputHandler(
        new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      );

      const state: NumberInputState = {
        value: -0,
        formattedValue: '-0.',
        selectionEnd: 3,
        selectionStart: 3,
        sign: -1,
      };

      handler.onChange(state, '0.0', 4, 4);

      expect(state).toStrictEqual({
        value: 0,
        formattedValue: '0.0',
        selectionEnd: 3,
        selectionStart: 3,
        sign: 1,
      });
    });

    test('ignores digits entered after the maximumFractionDigits', () => {
      const handler = new NumberInputHandler(
        new Intl.NumberFormat('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      );

      const state: NumberInputState = {
        value: 0,
        formattedValue: '0.0',
        selectionEnd: 3,
        selectionStart: 3,
        sign: 1,
      };

      handler.onChange(state, '0.09', 4, 4);

      expect(state).toStrictEqual({
        value: 0,
        formattedValue: '0.0',
        selectionEnd: 3,
        selectionStart: 3,
        sign: 1,
      });
    });

    test('negates if minus sign is entered after the maximumFractionDigits', () => {
      const handler = new NumberInputHandler(
        new Intl.NumberFormat('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      );

      const state: NumberInputState = {
        value: 1,
        formattedValue: '1.0',
        selectionEnd: 3,
        selectionStart: 3,
        sign: 1,
      };

      handler.onChange(state, '1.0-', 4, 4);

      expect(state).toStrictEqual({
        value: -1,
        formattedValue: '-1.0',
        selectionEnd: 4,
        selectionStart: 4,
        sign: -1,
      });
    });

    test('removes decimal separator', () => {
      const handler = new NumberInputHandler(
        new Intl.NumberFormat('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      );

      const state: NumberInputState = {
        value: 1,
        formattedValue: '1.0',
        selectionEnd: 2,
        selectionStart: 2,
        sign: 1,
      };

      handler.onChange(state, '10', 1, 1);

      expect(state).toStrictEqual({
        value: 10,
        formattedValue: '10',
        selectionEnd: 1,
        selectionStart: 1,
        sign: 1,
      });
    });

    test('moves decimal separator forward', () => {
      const handler = new NumberInputHandler(
        new Intl.NumberFormat('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      );

      const state: NumberInputState = {
        value: 1,
        formattedValue: '1.0',
        selectionEnd: 3,
        selectionStart: 3,
        sign: 1,
      };

      handler.onChange(state, '1.0.', 4, 4);

      expect(state).toStrictEqual({
        value: 10,
        formattedValue: '10.',
        selectionEnd: 3,
        selectionStart: 3,
        sign: 1,
      });
    });

    test('moves decimal separator backward', () => {
      const handler = new NumberInputHandler(
        new Intl.NumberFormat('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      );

      const state: NumberInputState = {
        value: 1,
        formattedValue: '1.0',
        selectionEnd: 0,
        selectionStart: 0,
        sign: 1,
      };

      handler.onChange(state, '.1.0', 1, 1);

      expect(state).toStrictEqual({
        value: 0.1,
        formattedValue: '0.1',
        selectionEnd: 2,
        selectionStart: 2,
        sign: 1,
      });
    });

    test('no-op if decoration char is inserted', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      const state: NumberInputState = {
        value: 100,
        formattedValue: '100',
        selectionEnd: 1,
        selectionStart: 1,
        sign: 1,
      };

      handler.onChange(state, '1x00', 2, 2);

      expect(state).toStrictEqual({
        value: 100,
        formattedValue: '100',
        selectionEnd: 1,
        selectionStart: 1,
        sign: 1,
      });
    });

    test('parses exotic number on paste', () => {
      const format = new Intl.NumberFormat('zh-Hans-CN-u-nu-hanidec', {
        style: 'currency',
        currencySign: 'accounting',
        currency: 'USD',
      });

      const formattedNumber = format.format(-9876543210.9);

      expect(formattedNumber).toBe('(US$九,八七六,五四三,二一〇.九〇)');

      const handler = new NumberInputHandler(format);

      const state: NumberInputState = {
        value: undefined,
        formattedValue: '',
        selectionEnd: 0,
        selectionStart: 0,
        sign: 1,
      };

      handler.onChange(state, '(US$九,八七六,五四三,二一〇.九〇)', 21, 21);

      expect(state).toStrictEqual({
        value: -9876543210.9,
        formattedValue: '(US$九,八七六,五四三,二一〇.九〇)',
        selectionEnd: 20,
        selectionStart: 20,
        sign: -1,
      });
    });

    test('formats percent style', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en', { style: 'percent' }));

      const state: NumberInputState = {
        value: undefined,
        formattedValue: '',
        selectionEnd: 0,
        selectionStart: 0,
        sign: 1,
      };

      handler.onChange(state, '5', 1, 1);

      expect(state).toStrictEqual({
        value: 0.05,
        formattedValue: '5%',
        selectionEnd: 1,
        selectionStart: 1,
        sign: 1,
      });
    });

    test('formats undefined value', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en', { style: 'currency', currency: 'usd' }), {
        isUndefinedValueFormatted: true,
      });

      const state: NumberInputState = {
        value: 1,
        formattedValue: '$1.00',
        selectionEnd: 0,
        selectionStart: 5,
        sign: 1,
      };

      handler.onChange(state, '', 0, 5);

      expect(state).toStrictEqual({
        value: undefined,
        formattedValue: '$',
        selectionEnd: 1,
        selectionStart: 1,
        sign: 1,
      });
    });

    test('undefined value format preserves sign', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en', { style: 'currency', currency: 'usd' }), {
        isUndefinedValueFormatted: true,
      });

      const state: NumberInputState = {
        value: -1,
        formattedValue: '-$1.00',
        selectionEnd: 0,
        selectionStart: 6,
        sign: -1,
      };

      handler.onChange(state, '-', 1, 1);

      expect(state).toStrictEqual({
        value: undefined,
        formattedValue: '-$',
        selectionEnd: 2,
        selectionStart: 2,
        sign: -1,
      });
    });
  });
});

describe('normalizeZeroes', () => {
  test('removes redundant leading zeroes', () => {
    expect(normalizeZeroes('0000')).toBe('0');
    expect(normalizeZeroes('0')).toBe('0');
    expect(normalizeZeroes('0001')).toBe('1');
    expect(normalizeZeroes('01')).toBe('1');
    expect(normalizeZeroes('1')).toBe('1');
    expect(normalizeZeroes('')).toBe('');
  });
});

describe('getNumberEncoding', () => {
  test('extracts digits and special characters', () => {
    expect(getNumberEncoding(new Intl.NumberFormat('en'))).toStrictEqual({
      digitCodePointMap: new Map([
        [48, '0'],
        [49, '1'],
        [50, '2'],
        [51, '3'],
        [52, '4'],
        [53, '5'],
        [54, '6'],
        [55, '7'],
        [56, '8'],
        [57, '9'],
      ]),
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);

    expect(getNumberEncoding(new Intl.NumberFormat('ru'))).toStrictEqual({
      digitCodePointMap: new Map([
        [48, '0'],
        [49, '1'],
        [50, '2'],
        [51, '3'],
        [52, '4'],
        [53, '5'],
        [54, '6'],
        [55, '7'],
        [56, '8'],
        [57, '9'],
      ]),
      decimalCodePoints: new Set([44, 46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);

    expect(getNumberEncoding(new Intl.NumberFormat('ar-EG'))).toStrictEqual({
      digitCodePointMap: new Map([
        [48, '0'],
        [49, '1'],
        [50, '2'],
        [51, '3'],
        [52, '4'],
        [53, '5'],
        [54, '6'],
        [55, '7'],
        [56, '8'],
        [57, '9'],
        [1632, '0'],
        [1633, '1'],
        [1634, '2'],
        [1635, '3'],
        [1636, '4'],
        [1637, '5'],
        [1638, '6'],
        [1639, '7'],
        [1640, '8'],
        [1641, '9'],
      ]),
      decimalCodePoints: new Set([1643, 46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);

    expect(getNumberEncoding(new Intl.NumberFormat('zh-Hans-CN-u-nu-hanidec'))).toStrictEqual({
      digitCodePointMap: new Map([
        [48, '0'],
        [49, '1'],
        [50, '2'],
        [51, '3'],
        [52, '4'],
        [53, '5'],
        [54, '6'],
        [55, '7'],
        [56, '8'],
        [57, '9'],
        [12295, '0'],
        [19968, '1'],
        [20108, '2'],
        [19977, '3'],
        [22235, '4'],
        [20116, '5'],
        [20845, '6'],
        [19971, '7'],
        [20843, '8'],
        [20061, '9'],
      ]),
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);

    expect(getNumberEncoding(new Intl.NumberFormat('sv-se'))).toStrictEqual({
      digitCodePointMap: new Map([
        [48, '0'],
        [49, '1'],
        [50, '2'],
        [51, '3'],
        [52, '4'],
        [53, '5'],
        [54, '6'],
        [55, '7'],
        [56, '8'],
        [57, '9'],
      ]),
      decimalCodePoints: new Set([44, 46]),
      minusSignCodePoints: new Set([45, 8722]),
    } satisfies NumberEncoding);
  });

  // test('signDisplay never does not discard the minus sign', () => {
  //   expect(getNumberEncoding(new Intl.NumberFormat('en', { signDisplay: 'never' }))).toStrictEqual({
  //     zeroChar: '0',
  //     decimalChar: '.',
  //     decimalCodePoints: new Set([46]),
  //     minusSignCodePoints: new Set([45]),
  //   } satisfies NumberEncoding);
  // });

  test('uses open round bracket as a minus sign for accounting currency sign', () => {
    const format = new Intl.NumberFormat('zh-Hans-CN-u-nu-hanidec', {
      style: 'currency',
      currencySign: 'accounting',
      currency: 'USD',
    });

    expect(format.format(-9876543210.9)).toBe('(US$九,八七六,五四三,二一〇.九〇)');

    expect(getNumberEncoding(format)).toStrictEqual({
      digitCodePointMap: new Map([
        [48, '0'],
        [49, '1'],
        [50, '2'],
        [51, '3'],
        [52, '4'],
        [53, '5'],
        [54, '6'],
        [55, '7'],
        [56, '8'],
        [57, '9'],
        [12295, '0'],
        [19968, '1'],
        [20108, '2'],
        [19977, '3'],
        [22235, '4'],
        [20116, '5'],
        [20845, '6'],
        [19971, '7'],
        [20843, '8'],
        [20061, '9'],
      ]),
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([40, 41, 45]),
    } satisfies NumberEncoding);
  });

  test('handles maximumSignificantDigits', () => {
    const format = new Intl.NumberFormat('en', { maximumSignificantDigits: 1 });

    expect(format.format(-9876543210.9)).toBe('-10,000,000,000');

    expect(getNumberEncoding(format)).toStrictEqual({
      digitCodePointMap: new Map([
        [48, '0'],
        [49, '1'],
        [50, '2'],
        [51, '3'],
        [52, '4'],
        [53, '5'],
        [54, '6'],
        [55, '7'],
        [56, '8'],
        [57, '9'],
      ]),
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);
  });

  test('style percent has no fraction part by default', () => {
    const format = new Intl.NumberFormat('en', { style: 'percent' });

    expect(format.format(1)).toBe('100%');

    expect(getNumberEncoding(format)).toStrictEqual({
      digitCodePointMap: new Map([
        [48, '0'],
        [49, '1'],
        [50, '2'],
        [51, '3'],
        [52, '4'],
        [53, '5'],
        [54, '6'],
        [55, '7'],
        [56, '8'],
        [57, '9'],
      ]),
      decimalCodePoints: new Set(),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);
  });

  test('style percent with fractions', () => {
    const format = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 1 });

    expect(format.format(1)).toBe('100%');

    expect(getNumberEncoding(format)).toStrictEqual({
      digitCodePointMap: new Map([
        [48, '0'],
        [49, '1'],
        [50, '2'],
        [51, '3'],
        [52, '4'],
        [53, '5'],
        [54, '6'],
        [55, '7'],
        [56, '8'],
        [57, '9'],
      ]),
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);
  });

  test('exotic style percent', () => {
    const format = new Intl.NumberFormat('zh-Hans-CN-u-nu-hanidec', { style: 'percent', maximumFractionDigits: 1 });

    expect(format.format(1)).toBe('一〇〇%');

    expect(getNumberEncoding(format)).toStrictEqual({
      digitCodePointMap: new Map([
        [48, '0'],
        [49, '1'],
        [50, '2'],
        [51, '3'],
        [52, '4'],
        [53, '5'],
        [54, '6'],
        [55, '7'],
        [56, '8'],
        [57, '9'],
        [12295, '0'],
        [19968, '1'],
        [20108, '2'],
        [19977, '3'],
        [22235, '4'],
        [20116, '5'],
        [20845, '6'],
        [19971, '7'],
        [20843, '8'],
        [20061, '9'],
      ]),
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);
  });
});

describe('decodeNumericChars', () => {
  test('decodes a number', () => {
    const format = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' });

    expect(decodeNumericChars(format.format(-9876543210.9), getNumberEncoding(format))).toBe('-9876543210.90');

    expect(decodeNumericChars('11.22', getNumberEncoding(format))).toBe('11.22');
    expect(decodeNumericChars('11.22.33', getNumberEncoding(format))).toBe('11.22');
    expect(decodeNumericChars('.', getNumberEncoding(format))).toBe('.');
    expect(decodeNumericChars('..', getNumberEncoding(format))).toBe('.');
    expect(decodeNumericChars('-', getNumberEncoding(format))).toBe('-');
    expect(decodeNumericChars('--', getNumberEncoding(format))).toBe('-');
    expect(decodeNumericChars('.-', getNumberEncoding(format))).toBe('.');
    expect(decodeNumericChars('-.', getNumberEncoding(format))).toBe('-.');
    expect(decodeNumericChars('--.', getNumberEncoding(format))).toBe('-');
  });

  test('decodes an exotic number', () => {
    const format = new Intl.NumberFormat('zh-Hans-CN-u-nu-hanidec', {
      style: 'currency',
      currencySign: 'accounting',
      currency: 'USD',
    });

    const formattedNumber = format.format(-9876543210.9);

    expect(formattedNumber).toBe('(US$九,八七六,五四三,二一〇.九〇)');

    expect(decodeNumericChars(formattedNumber, getNumberEncoding(format))).toBe('-9876543210.90');
  });
});

describe('encodeNumericChars', () => {
  test('returns number format parts', () => {
    expect(encodeNumericChars(new Intl.NumberFormat('en'), '1', 1)).toStrictEqual({
      value: 1,
      parts: [{ type: 'integer', value: '1' }],
    } satisfies NumberValueParts);

    expect(encodeNumericChars(new Intl.NumberFormat('en'), '1', -1)).toStrictEqual({
      value: -1,
      parts: [
        { type: 'minusSign', value: '-' },
        { type: 'integer', value: '1' },
      ],
    } satisfies NumberValueParts);
  });

  test('removes non-decoration parts if number is empty', () => {
    expect(encodeNumericChars(new Intl.NumberFormat('en'), '', 1)).toStrictEqual({
      value: undefined,
      parts: [{ type: 'integer', value: '' }],
    } satisfies NumberValueParts);

    expect(encodeNumericChars(new Intl.NumberFormat('en', { minimumFractionDigits: 2 }), '', 1)).toStrictEqual({
      value: undefined,
      parts: [
        { type: 'integer', value: '' },
        { type: 'decimal', value: '' },
        { type: 'fraction', value: '' },
      ],
    } satisfies NumberValueParts);

    expect(
      encodeNumericChars(
        new Intl.NumberFormat('en', {
          style: 'currency',
          currency: 'USD',
          currencySign: 'accounting',
          minimumFractionDigits: 2,
        }),
        '',
        -1
      )
    ).toStrictEqual({
      value: undefined,
      parts: [
        { type: 'literal', value: '(' },
        { type: 'currency', value: '$' },
        { type: 'integer', value: '' },
        { type: 'decimal', value: '' },
        { type: 'fraction', value: '' },
        { type: 'literal', value: ')' },
      ],
    } satisfies NumberValueParts);
  });

  test('renders the exact number of fraction digits', () => {
    expect(encodeNumericChars(new Intl.NumberFormat('en'), '1.23', -1)).toStrictEqual({
      value: -1.23,
      parts: [
        { type: 'minusSign', value: '-' },
        { type: 'integer', value: '1' },
        { type: 'decimal', value: '.' },
        { type: 'fraction', value: '23' },
      ],
    } satisfies NumberValueParts);

    expect(encodeNumericChars(new Intl.NumberFormat('en', { maximumFractionDigits: 1 }), '1.23', 1)).toStrictEqual({
      value: 1.2,
      parts: [
        { type: 'integer', value: '1' },
        { type: 'decimal', value: '.' },
        { type: 'fraction', value: '2' },
      ],
    } satisfies NumberValueParts);

    expect(encodeNumericChars(new Intl.NumberFormat('en', { maximumFractionDigits: 1 }), '1.', 1)).toStrictEqual({
      value: 1,
      parts: [
        { type: 'integer', value: '1' },
        { type: 'decimal', value: '.' },
        { type: 'fraction', value: '' },
      ],
    } satisfies NumberValueParts);
  });
});
