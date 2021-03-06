import {useRef} from 'react';

/**
 * Returns an always-stable function identity.
 */
export function useHandler<A extends any[], T>(handler: (...args: A) => T): (...args: A) => T;

/**
 * Returns an always-stable function identity.
 */
export function useHandler<A extends any[], T>(handler: ((...args: A) => T) | null | undefined): (...args: A) => T | undefined;

export function useHandler<A extends any[], T>(handler: ((...args: A) => T) | null | undefined) {
  const handlerRef = useRef(handler);

  handlerRef.current = handler;

  return useRef<(...args: A) => any>().current ||= ((...args) => handlerRef.current?.apply(undefined, args));
}
