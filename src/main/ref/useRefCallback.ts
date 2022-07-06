import { MutableRefObject, RefCallback, RefObject, useRef } from 'react';

export type ExactRefCallback<T> = { bivarianceHack(value: T): void }['bivarianceHack'];

/**
 * Returns a ref object and a callback to update the value of this ref.
 *
 * @param initialValue The initial ref value.
 */
export function useRefCallback<T>(initialValue: T): readonly [ref: MutableRefObject<T>, updateRef: ExactRefCallback<T>];

/**
 * Returns a ref object and a callback to update the value of this ref.
 *
 * @param initialValue The initial ref value.
 */
export function useRefCallback<T>(initialValue: T | null): readonly [ref: RefObject<T>, updateRef: RefCallback<T>];

/**
 * Returns a ref object and a callback to update the value of this ref.
 */
export function useRefCallback<T = undefined>(): readonly [
  ref: MutableRefObject<T | undefined>,
  updateRef: ExactRefCallback<T | undefined>
];

export function useRefCallback(initialValue?: unknown) {
  const ref = useRef(initialValue);
  return (useRef<ReturnType<typeof createRefCallbackProtocol>>().current ||= createRefCallbackProtocol(ref));
}

function createRefCallbackProtocol(ref: MutableRefObject<unknown>) {
  const updateRef: RefCallback<unknown> = value => {
    ref.current = value;
  };

  return [ref, updateRef] as const;
}
