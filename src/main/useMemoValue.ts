import { useRef } from 'react';
import { isShallowEqual, NEVER } from './utils/lang.js';

/**
 * Returns the value from the previous render if it is considered equal to the newly provided value according to
 * the comparator.
 *
 * @example
 * useMemoValue({ foo: 'hello' });
 *
 * @param value The current value.
 * @param comparator A function that compares the previous and next values. By default,
 * {@link isShallowEqual shallow equality comparator} is used.
 * @group Other
 */
export function useMemoValue<T>(value: T, comparator: (prevValue: T, nextValue: T) => boolean = isShallowEqual): T {
  const cacheRef = useRef<T>(NEVER);

  if (cacheRef.current !== NEVER && comparator(cacheRef.current, value)) {
    return cacheRef.current;
  }

  cacheRef.current = value;
  return value;
}
