import { useRef } from 'react';
import { NEVER } from './utils/lang.js';

/**
 * Returns the value from the previous render if it is considered equal to the newly provided value according to
 * the comparator.
 *
 * @param value The current value.
 * @param comparator A function that compares the previous and next values.
 * @see {@link isShallowEqual}
 * @group Other
 */
export function useCachedValue<T>(value: T, comparator: (prevValue: T, nextValue: T) => boolean): T {
  const ref = useRef<T>(NEVER);

  if (ref.current !== NEVER && comparator(ref.current, value)) {
    return ref.current;
  }

  ref.current = value;
  return value;
}
