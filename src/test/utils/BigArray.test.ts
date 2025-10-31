import { expect, test, vi } from 'vitest';
import { BigArray } from '../../main/index.js';

test('sets and retrieves a value at an index', () => {
  const arr = new BigArray();

  expect(arr.get(0)).toBeUndefined();

  arr.set(0, 'aaa');
  expect(arr.get(0)).toBe('aaa');

  arr.set(-1, 'bbb');
  expect(arr.get(-1)).toBe('bbb');

  arr.set(Number.MAX_SAFE_INTEGER, 'ccc');
  expect(arr.get(Number.MAX_SAFE_INTEGER)).toBe('ccc');

  arr.set(Number.MIN_SAFE_INTEGER, 'ddd');
  expect(arr.get(Number.MIN_SAFE_INTEGER)).toBe('ddd');
});

test('throws if invalid index', () => {
  const arr = new BigArray();

  expect(() => arr.set(0.5, 'aaa')).toThrow(new RangeError('Index out of bounds'));
  expect(() => arr.set(1e500, 'aaa')).toThrow(new RangeError('Index out of bounds'));
  expect(() => arr.getOrSet(0.5, 'aaa')).toThrow(new RangeError('Index out of bounds'));
  expect(() => arr.getOrSet(1e500, 'aaa')).toThrow(new RangeError('Index out of bounds'));
});

test('updates startIndex/endIndex', () => {
  const arr = new BigArray();

  expect(arr.startIndex).toBe(0);
  expect(arr.endIndex).toBe(0);

  arr.set(1, 'aaa');

  expect(arr.startIndex).toBe(1);
  expect(arr.endIndex).toBe(2);

  arr.set(-100, 'aaa');

  expect(arr.startIndex).toBe(-100);
  expect(arr.endIndex).toBe(2);
});

test('updates positiveCount/negativeCount', () => {
  const arr = new BigArray();

  expect(arr.positiveCount).toBe(0);
  expect(arr.negativeCount).toBe(0);

  arr.set(1, 'aaa');

  expect(arr.positiveCount).toBe(1);
  expect(arr.negativeCount).toBe(0);

  arr.set(-100, 'aaa');
  arr.set(-200, 'bbb');

  expect(arr.positiveCount).toBe(1);
  expect(arr.negativeCount).toBe(2);
});

test('gets or sets a value', () => {
  const arr = new BigArray();

  expect(arr.getOrSet(0, 'aaa')).toBe('aaa');
  expect(arr.getOrSet(0, 'bbb')).toBe('aaa');
});

test('gets or sets a lazy value', () => {
  const arr = new BigArray();
  const lazyValue1 = vi.fn().mockReturnValue('aaa');
  const lazyValue2 = vi.fn().mockReturnValue('bbb');

  expect(arr.getOrSet(111, lazyValue1)).toBe('aaa');
  expect(arr.getOrSet(111, lazyValue2)).toBe('aaa');

  expect(lazyValue1).toHaveBeenCalledTimes(1);
  expect(lazyValue1).toHaveBeenNthCalledWith(1, 111);
  expect(lazyValue2).not.toHaveBeenCalled();
});

test('push a value', () => {
  const arr = new BigArray();

  arr.push('aaa');

  expect(arr.startIndex).toBe(0);
  expect(arr.endIndex).toBe(1);

  expect(arr.get(0)).toBe('aaa');

  arr.push('ccc');

  expect(arr.startIndex).toBe(0);
  expect(arr.endIndex).toBe(2);

  expect(arr.get(1)).toBe('ccc');
});

test('push a value after endIndex', () => {
  const arr = new BigArray();

  arr.set(-100, 'xxx');
  arr.push('aaa');

  expect(arr.startIndex).toBe(-100);
  expect(arr.endIndex).toBe(-98);

  expect(arr.get(-100)).toBe('xxx');
  expect(arr.get(-99)).toBe('aaa');
});

test('unshift a value', () => {
  const arr = new BigArray();

  arr.unshift('aaa');

  expect(arr.startIndex).toBe(-1);
  expect(arr.endIndex).toBe(0);

  expect(arr.get(-1)).toBe('aaa');

  arr.unshift('bbb');

  expect(arr.startIndex).toBe(-2);
  expect(arr.endIndex).toBe(0);

  expect(arr.get(-2)).toBe('bbb');
});

test('returns an index iterator', () => {
  const arr = new BigArray();

  expect(Array.from(arr.indexes())).toEqual([]);

  arr.set(333, 'ccc');
  arr.set(222, 'bbb');
  arr.set(-111, 'aaa');
  arr.set(Number.MIN_SAFE_INTEGER, 'zzz');

  expect(Array.from(arr.indexes())).toEqual([Number.MIN_SAFE_INTEGER, -111, 222, 333]);
});

test('returns a value iterator', () => {
  expect(Array.from(new BigArray().copyOver([1, 2, 3]))).toEqual([1, 2, 3]);
});

test('copy over a Set', () => {
  const arr = new BigArray().copyOver(new Set([1, 2, 3]), 222);

  expect(arr.startIndex).toBe(222);
  expect(arr.endIndex).toBe(225);
  expect(Array.from(arr)).toEqual([1, 2, 3]);
});

test('copy over another BigArray', () => {
  const arr = new BigArray().copyOver(new BigArray().set(111, 'aaa').set(222, 'bbb'));

  expect(arr.startIndex).toBe(111);
  expect(arr.endIndex).toBe(223);
  expect(arr.has(221)).toBe(false);
  expect(Array.from(arr)).toEqual(['aaa', 'bbb']);
});

test('returns a slice', () => {
  const arr = new BigArray().push(111).push(222).push(333).unshift(-111);

  expect(arr.slice()).toEqual([-111, 111, 222, 333]);
});
