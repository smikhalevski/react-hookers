import { MutableRefObject, RefCallback, RefObject, useRef } from 'react';

/**
 * Returns a ref object and a callback to update the value of this ref.
 *
 * @param initialValue The initial ref value.
 */
export function useRefCallback<T>(initialValue: T): [ref: MutableRefObject<T>, setRef: (value: T) => void];

/**
 * Returns a ref object and a callback to update the value of this ref.
 *
 * @param initialValue The initial ref value.
 */
export function useRefCallback<T>(initialValue: T | null): [ref: RefObject<T>, setRef: RefCallback<T>];

/**
 * Returns a ref object and a callback to update the value of this ref.
 */
export function useRefCallback<T = undefined>(): [
  ref: MutableRefObject<T | undefined>,
  setRef: (value: T | undefined) => void
];

export function useRefCallback(initialValue?: unknown) {
  const ref = useRef(initialValue);
  const refCallback = (useRef<RefCallback<unknown>>().current ||= value => {
    ref.current = value;
  });

  return [ref, refCallback] as const;
}
