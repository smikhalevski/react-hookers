import { describe, expect, test } from 'vitest';
import {
  decodeNumberChars,
  extractNumberEncoding,
  normalizeZeroes,
  type NumberEncoding,
  NumberInputHandler,
  NumberInputState,
} from '../../../main/components/formatted-input/NumberInputHandler.js';

describe('NumberInputHandler', () => {
  describe('new', () => {
    test('returns a new instance', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler['_formatOptions']).toEqual({
        locale: 'en',
        maximumFractionDigits: 3,
        minimumFractionDigits: 0,
        minimumIntegerDigits: 1,
        notation: 'standard',
        numberingSystem: 'latn',
        roundingIncrement: 1,
        roundingMode: 'halfExpand',
        roundingPriority: 'auto',
        signDisplay: 'auto',
        style: 'decimal',
        trailingZeroDisplay: 'auto',
        useGrouping: 'auto',
      });

      expect(handler['_options']).toEqual({});

      expect(handler['_encoding']).toEqual({
        decimalChar: '.',
        zeroChar: '0',
        '-': '-',
        '.': '.',
        '0': '0',
        '1': '1',
        '2': '2',
        '3': '3',
        '4': '4',
        '5': '5',
        '6': '6',
        '7': '7',
        '8': '8',
        '9': '9',
      });
    });

    test('throws if notation is unsupported', () => {
      expect(() => new NumberInputHandler(new Intl.NumberFormat('en', { notation: 'compact' }))).toThrow(
        new Error('Unsupported number notation: compact')
      );
    });
  });

  describe('getInitialState', () => {
    test('returns state for an undefined value', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(undefined)).toEqual({
        value: undefined,
        formattedValue: '',
        selectionStart: 0,
        selectionEnd: 0,
        isNegative: false,
      });
    });

    test('returns state for a non-finite value', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(NaN)).toEqual({
        value: undefined,
        formattedValue: '',
        selectionStart: 0,
        selectionEnd: 0,
        isNegative: false,
      });

      expect(handler.getInitialState(Infinity)).toEqual({
        value: undefined,
        formattedValue: '',
        selectionStart: 0,
        selectionEnd: 0,
        isNegative: false,
      });
    });

    test('returns state for negative value', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(-1000)).toEqual({
        value: -1000,
        formattedValue: '-1,000',
        selectionStart: 0,
        selectionEnd: 0,
        isNegative: true,
      });
    });

    test('returns state for positive value', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(1000)).toEqual({
        value: 1000,
        formattedValue: '1,000',
        selectionStart: 0,
        selectionEnd: 0,
        isNegative: false,
      });
    });

    test('returns state for zero', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(0)).toEqual({
        value: 0,
        formattedValue: '0',
        selectionStart: 0,
        selectionEnd: 0,
        isNegative: false,
      });
    });

    test('returns state for negative zero', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      expect(handler.getInitialState(-0)).toEqual({
        value: -0,
        formattedValue: '-0',
        selectionStart: 0,
        selectionEnd: 0,
        isNegative: true,
      });
    });

    test('formats undefined value', () => {
      const format = new Intl.NumberFormat('zh-Hans-CN-u-nu-hanidec', {
        style: 'currency',
        currencySign: 'accounting',
        currency: 'USD',
      });

      const handler = new NumberInputHandler(format, { isUndefinedValueFormatted: true });

      expect(handler.getInitialState(undefined)).toEqual({
        value: undefined,
        formattedValue: 'US$',
        selectionEnd: 3,
        selectionStart: 3,
        isNegative: false,
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
        isNegative: false,
      };

      handler.onChange(state, '1', 1, 1);

      expect(state).toEqual({
        value: 1,
        formattedValue: '1',
        selectionEnd: 1,
        selectionStart: 1,
        isNegative: false,
      });
    });

    test('replaces a substring', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      const state: NumberInputState = {
        value: 1000,
        formattedValue: '1,000',
        selectionStart: 2,
        selectionEnd: 4,
        isNegative: false,
      };

      handler.onChange(state, '333', 2, 4);

      expect(state).toEqual({
        value: 333,
        formattedValue: '333',
        selectionEnd: 3,
        selectionStart: 3,
        isNegative: false,
      });
    });

    test('formats a minus sign', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      const state: NumberInputState = {
        value: undefined,
        formattedValue: '',
        selectionStart: 0,
        selectionEnd: 0,
        isNegative: false,
      };

      handler.onChange(state, '-', 1, 1);

      expect(state).toEqual({
        value: undefined,
        formattedValue: '-',
        selectionEnd: 1,
        selectionStart: 1,
        isNegative: true,
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
        isNegative: false,
      };

      handler.onChange(state, '-', 1, 1);

      expect(state).toEqual({
        value: undefined,
        formattedValue: '($)',
        selectionEnd: 2,
        selectionStart: 2,
        isNegative: true,
      });
    });

    test('negates positive value with minus sign', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      const state: NumberInputState = {
        value: 1000,
        formattedValue: '1,000',
        selectionStart: 1,
        selectionEnd: 1,
        isNegative: false,
      };

      handler.onChange(state, '1-,000', 2, 2);

      expect(state).toEqual({
        value: -1000,
        formattedValue: '-1,000',
        selectionEnd: 2,
        selectionStart: 2,
        isNegative: true,
      });
    });

    test('negates negative value with minus sign', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      const state: NumberInputState = {
        value: -1000,
        formattedValue: '-1,000',
        selectionStart: 2,
        selectionEnd: 2,
        isNegative: true,
      };

      handler.onChange(state, '-1,-000', 4, 4);

      expect(state).toEqual({
        value: 1000,
        formattedValue: '1,000',
        selectionEnd: 1,
        selectionStart: 1,
        isNegative: false,
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
        isNegative: true,
      };

      handler.onChange(state, '.', 1, 1);

      expect(state).toEqual({
        value: -0,
        formattedValue: '-0.',
        selectionEnd: 3,
        selectionStart: 3,
        isNegative: true,
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
        isNegative: true,
      };

      handler.onChange(state, '0.0', 4, 4);

      expect(state).toEqual({
        value: 0,
        formattedValue: '0.0',
        selectionEnd: 3,
        selectionStart: 3,
        isNegative: false,
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
        isNegative: false,
      };

      handler.onChange(state, '0.09', 4, 4);

      expect(state).toEqual({
        value: 0,
        formattedValue: '0.0',
        selectionEnd: 3,
        selectionStart: 3,
        isNegative: false,
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
        isNegative: false,
      };

      handler.onChange(state, '1.0-', 4, 4);

      expect(state).toEqual({
        value: -1,
        formattedValue: '-1.0',
        selectionEnd: 4,
        selectionStart: 4,
        isNegative: true,
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
        isNegative: false,
      };

      handler.onChange(state, '10', 1, 1);

      expect(state).toEqual({
        value: 10,
        formattedValue: '10',
        selectionEnd: 1,
        selectionStart: 1,
        isNegative: false,
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
        isNegative: false,
      };

      handler.onChange(state, '1.0.', 4, 4);

      expect(state).toEqual({
        value: 10,
        formattedValue: '10.',
        selectionEnd: 3,
        selectionStart: 3,
        isNegative: false,
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
        isNegative: false,
      };

      handler.onChange(state, '.1.0', 1, 1);

      expect(state).toEqual({
        value: 0.1,
        formattedValue: '0.1',
        selectionEnd: 2,
        selectionStart: 2,
        isNegative: false,
      });
    });

    test('no-op if decoration char is inserted', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en'));

      const state: NumberInputState = {
        value: 100,
        formattedValue: '100',
        selectionEnd: 1,
        selectionStart: 1,
        isNegative: false,
      };

      handler.onChange(state, '1x00', 2, 2);

      expect(state).toEqual({
        value: 100,
        formattedValue: '100',
        selectionEnd: 1,
        selectionStart: 1,
        isNegative: false,
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
        isNegative: false,
      };

      handler.onChange(state, '(US$九,八七六,五四三,二一〇.九〇)', 21, 21);

      expect(state).toEqual({
        value: -9876543210.9,
        formattedValue: '(US$九,八七六,五四三,二一〇.九〇)',
        selectionEnd: 20,
        selectionStart: 20,
        isNegative: true,
      });
    });

    test('formats percent style', () => {
      const handler = new NumberInputHandler(new Intl.NumberFormat('en', { style: 'percent' }));

      const state: NumberInputState = {
        value: undefined,
        formattedValue: '',
        selectionEnd: 0,
        selectionStart: 0,
        isNegative: false,
      };

      handler.onChange(state, '5', 1, 1);

      expect(state).toEqual({
        value: 0.05,
        formattedValue: '5%',
        selectionEnd: 1,
        selectionStart: 1,
        isNegative: false,
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
        isNegative: false,
      };

      handler.onChange(state, '', 0, 5);

      expect(state).toEqual({
        value: undefined,
        formattedValue: '$',
        selectionEnd: 1,
        selectionStart: 1,
        isNegative: false,
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
        isNegative: true,
      };

      handler.onChange(state, '-', 1, 1);

      expect(state).toEqual({
        value: undefined,
        formattedValue: '-$',
        selectionEnd: 2,
        selectionStart: 2,
        isNegative: true,
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

describe('extractNumberEncoding', () => {
  test('extracts digits and special characters', () => {
    expect(extractNumberEncoding(new Intl.NumberFormat('en'))).toEqual({
      zeroChar: '0',
      decimalChar: '.',
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);

    expect(extractNumberEncoding(new Intl.NumberFormat('ru'))).toEqual({
      zeroChar: '0',
      decimalChar: ',',
      decimalCodePoints: new Set([44, 46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);

    expect(extractNumberEncoding(new Intl.NumberFormat('ar-EG'))).toEqual({
      zeroChar: '٠',
      decimalChar: '٫',
      decimalCodePoints: new Set([1643, 46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);

    expect(extractNumberEncoding(new Intl.NumberFormat('zh-Hans-CN-u-nu-hanidec'))).toEqual({
      zeroChar: '〇',
      decimalChar: '.',
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);
  });

  test('ignores minus sign', () => {
    expect(extractNumberEncoding(new Intl.NumberFormat('en'), true)).toEqual({
      zeroChar: '0',
      decimalChar: '.',
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set(),
    } satisfies NumberEncoding);
  });

  test('signDisplay never does not discard the minus sign', () => {
    expect(extractNumberEncoding(new Intl.NumberFormat('en', { signDisplay: 'never' }))).toEqual({
      zeroChar: '0',
      decimalChar: '.',
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);
  });

  test('uses open round bracket as a minus sign for accounting currency sign', () => {
    const format = new Intl.NumberFormat('zh-Hans-CN-u-nu-hanidec', {
      style: 'currency',
      currencySign: 'accounting',
      currency: 'USD',
    });

    expect(format.format(-9876543210.9)).toBe('(US$九,八七六,五四三,二一〇.九〇)');

    expect(extractNumberEncoding(format)).toEqual({
      zeroChar: '〇',
      decimalChar: '.',
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([40, 41, 45]),
    } satisfies NumberEncoding);
  });

  test('handles maximumSignificantDigits', () => {
    const format = new Intl.NumberFormat('en', { maximumSignificantDigits: 1 });

    expect(format.format(-9876543210.9)).toBe('-10,000,000,000');

    expect(extractNumberEncoding(format)).toEqual({
      zeroChar: '0',
      decimalChar: '.',
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);
  });

  test('style percent has no fraction part by default', () => {
    const format = new Intl.NumberFormat('en', { style: 'percent' });

    expect(format.format(1)).toBe('100%');

    expect(extractNumberEncoding(format)).toEqual({
      zeroChar: '0',
      decimalChar: undefined,
      decimalCodePoints: new Set(),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);
  });

  test('style percent with fractions', () => {
    const format = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 1 });

    expect(format.format(1)).toBe('100%');

    expect(extractNumberEncoding(format)).toEqual({
      zeroChar: '0',
      decimalChar: '.',
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);
  });

  test('exotic style percent', () => {
    const format = new Intl.NumberFormat('zh-Hans-CN-u-nu-hanidec', { style: 'percent', maximumFractionDigits: 1 });

    expect(format.format(1)).toBe('一〇〇%');

    expect(extractNumberEncoding(format)).toEqual({
      zeroChar: '〇',
      decimalChar: '.',
      decimalCodePoints: new Set([46]),
      minusSignCodePoints: new Set([45]),
    } satisfies NumberEncoding);
  });
});

describe('decodeNumberChars', () => {
  test('decodes a number', () => {
    const format = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' });

    expect(decodeNumberChars(format.format(-9876543210.9), extractNumberEncoding(format))).toBe('-9876543210.90');

    expect(decodeNumberChars('11.22', extractNumberEncoding(format))).toBe('11.22');
    expect(decodeNumberChars('11.22.33', extractNumberEncoding(format))).toBe('11.22');
    expect(decodeNumberChars('.', extractNumberEncoding(format))).toBe('.');
    expect(decodeNumberChars('..', extractNumberEncoding(format))).toBe('.');
    expect(decodeNumberChars('-', extractNumberEncoding(format))).toBe('-');
    expect(decodeNumberChars('--', extractNumberEncoding(format))).toBe('-');
    expect(decodeNumberChars('.-', extractNumberEncoding(format))).toBe('.');
    expect(decodeNumberChars('-.', extractNumberEncoding(format))).toBe('-.');
    expect(decodeNumberChars('--.', extractNumberEncoding(format))).toBe('-');
  });

  test('decodes an exotic number', () => {
    const format = new Intl.NumberFormat('zh-Hans-CN-u-nu-hanidec', {
      style: 'currency',
      currencySign: 'accounting',
      currency: 'USD',
    });

    const formattedNumber = format.format(-9876543210.9);

    expect(formattedNumber).toBe('(US$九,八七六,五四三,二一〇.九〇)');

    expect(decodeNumberChars(formattedNumber, extractNumberEncoding(format))).toBe('-9876543210.90');
  });
});
