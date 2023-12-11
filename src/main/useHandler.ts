import { useRef } from 'react';
import { useInsertionEffect } from './useInsertionEffect';

/**
 * Returns an always-stable function identity that becomes no-op after unmount.
 */
export function useHandler<A extends any[], T>(cb: (...args: A) => T): (...args: A) => T;

/**
 * Returns an always-stable function identity that becomes no-op after unmount.
 */
export function useHandler<A extends any[], T>(
  cb: ((...args: A) => T) | null | undefined
): (...args: A) => T | undefined;

export function useHandler<A extends any[], T>(cb: ((...args: A) => T) | null | undefined) {
  const ref = useRef(cb);

  useInsertionEffect(() => {
    ref.current = cb;

    return () => {
      ref.current = undefined;
    };
  }, [cb]);

  return (useRef<(...args: A) => T | undefined>().current ||= (...args) => ref.current?.apply(undefined, args));
}
