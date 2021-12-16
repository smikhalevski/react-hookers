import {areHookInputsEqual} from '../main';

describe('areHookInputsEqual', () => {

  test('returns true for equal arrays', () => {
    expect(areHookInputsEqual(['abc'], ['abc'])).toBe(true);
  });

  test('does not do type coercion', () => {
    expect(areHookInputsEqual([{toString: () => 'abc'}], ['abc'])).toBe(false);
  });

  test('considers NaN to be equal to NaN', () => {
    expect(areHookInputsEqual([NaN], [NaN])).toBe(true);
  });

  test('returns false for null deps', () => {
    expect(areHookInputsEqual(undefined, undefined)).toBe(false);
    expect(areHookInputsEqual([], undefined)).toBe(false);
    expect(areHookInputsEqual(undefined, [])).toBe(false);
    expect(areHookInputsEqual(null as any, null as any)).toBe(false);
  });

  test('returns false for unequal length deps', () => {
    expect(areHookInputsEqual([], [1])).toBe(false);
  });

  test('deps can be an array-like object', () => {
    expect(areHookInputsEqual(['abc'], {length: 1, 0: 'abc'} as any)).toBe(true);
  });
});
