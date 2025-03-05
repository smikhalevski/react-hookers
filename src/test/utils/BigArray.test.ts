import { BigArray } from '../../main';

describe('BigArray', () => {
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

  test('updates startIndex', () => {
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

  test('gets or sets a value', () => {
    const arr = new BigArray();

    expect(arr.getOrSet(0, 'aaa')).toBe('aaa');
    expect(arr.getOrSet(0, 'bbb')).toBe('aaa');
  });

  test('gets or sets a lazy value', () => {
    const arr = new BigArray();
    const lazyValue1 = jest.fn().mockReturnValue('aaa');
    const lazyValue2 = jest.fn().mockReturnValue('bbb');

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

    expect(Array.from(arr.indexes())).toEqual([-111, 222, 333]);
  });
});
