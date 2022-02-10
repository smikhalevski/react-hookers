import {MutableRefObject, useRef} from 'react';

/**
 * Creates a `MutableRefObject` that is updated on every render with the given value.
 */
export function useValueRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
