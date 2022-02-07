import {RefObject, useRef} from 'react';

/**
 * Creates a `RefObject` that is updated on every render with the given value.
 */
export function useValueRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
