import {MutableRefObject, useRef} from 'react';

/**
 * Creates a `MutableRefObject` that keeps ref to the given value. This hook comes in handy if you want to use the
 * props provided during the most recent render in the async context.
 */
export function useRenderedValueRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
