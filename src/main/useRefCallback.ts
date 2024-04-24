import { MutableRefObject, RefCallback, RefObject, useCallback, useRef } from 'react';
import { emptyDeps } from './utils';

/**
 * Returns a ref object and a callback to update the value of this ref.
 *
 * @param initialValue The initial ref value.
 */
export function useRefCallback<T>(initialValue: T): [ref: MutableRefObject<T>, refCallback: (value: T) => void];

/**
 * Returns a ref object and a callback to update the value of this ref.
 *
 * @param initialValue The initial ref value.
 */
export function useRefCallback<T>(initialValue: T | null): [ref: RefObject<T>, refCallback: RefCallback<T>];

/**
 * Returns a ref object and a callback to update the value of this ref.
 */
export function useRefCallback<T = undefined>(): [
  ref: MutableRefObject<T | undefined>,
  refCallback: (value: T | undefined) => void,
];

export function useRefCallback(initialValue?: unknown) {
  const ref = useRef(initialValue);
  const refCallback = useCallback<RefCallback<unknown>>(value => {
    ref.current = value;
  }, emptyDeps);

  return [ref, refCallback] as const;
}
