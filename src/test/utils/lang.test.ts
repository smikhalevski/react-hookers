import { describe, expect, test } from 'vitest';
import { isShallowEqual } from '../../main/utils/lang.js';

describe('isShallowEqual', () => {
  test('returns true if values are shallow equal', () => {
    expect(isShallowEqual(null, null)).toBe(true);
    expect(isShallowEqual(undefined, undefined)).toBe(true);
    expect(isShallowEqual(null, undefined)).toBe(false);
    expect(isShallowEqual(111, 111)).toBe(true);
    expect(isShallowEqual(111, 222)).toBe(false);
    expect(isShallowEqual([111], [111])).toBe(true);
    expect(isShallowEqual([111], [222])).toBe(false);
    expect(isShallowEqual({ xxx: 111 }, { xxx: 111 })).toBe(true);
    expect(isShallowEqual({ xxx: 111 }, { xxx: 222 })).toBe(false);
    expect(isShallowEqual({ xxx: 111 }, { yyy: 111 })).toBe(false);
    expect(isShallowEqual({ xxx: [111] }, { xxx: [111] })).toBe(false);
  });
});
