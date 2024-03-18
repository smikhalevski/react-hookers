import { useEffect, useRef } from 'react';

/**
 * Returns an always-stable function identity that becomes a no-op after unmount.
 *
 * @param cb The callback that the handler callback.
 * @template A The arguments of the handler.
 * @template T The return value of the handler.
 */
export function useHandler<A extends any[], T>(cb: (...args: A) => T): (...args: A) => T;

/**
 * Returns an always-stable function identity that becomes no-op after unmount.
 *
 * @param cb The callback that the handler callback.
 * @template A The arguments of the handler.
 * @template T The return value of the handler.
 */
export function useHandler<A extends any[], T>(
  cb: ((...args: A) => T) | null | undefined
): (...args: A) => T | undefined;

export function useHandler<A extends any[], T>(cb: ((...args: A) => T) | null | undefined) {
  const ref = useRef(cb);

  useEffect(() => {
    ref.current = cb;

    return () => {
      ref.current = undefined;
    };
  }, [cb]);

  return (useRef<(...args: A) => T | undefined>().current ||= (...args) => ref.current?.apply(undefined, args));
}
