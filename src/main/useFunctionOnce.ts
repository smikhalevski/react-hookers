import { useRef } from 'react';
import { NEVER } from './utils/lang.js';

/**
 * Calls a function during the initial render and caches its result until the component is unmounted.
 *
 * @param fn The function to call.
 * @param args The function arguments.
 * @returns The function's return value, or the cached return value.
 * @template A The function arguments.
 * @template R The function return value.
 * @see {@link useFunction}
 * @see {@link useFunctionEffect}
 * @group Other
 */
export function useFunctionOnce<A extends any[], R>(fn: (...args: A) => R, ...args: A): R;

export function useFunctionOnce(fn: Function) {
  const cacheRef = useRef<unknown>(NEVER);

  if (cacheRef.current !== NEVER) {
    return cacheRef.current;
  }

  if (arguments.length === 1) {
    return (cacheRef.current = fn());
  }

  if (arguments.length === 2) {
    return (cacheRef.current = fn(arguments[1]));
  }

  const args = [];

  for (let i = 1; i < arguments.length; ++i) {
    args.push(arguments[i]);
  }

  return (cacheRef.current = fn(...args));
}
