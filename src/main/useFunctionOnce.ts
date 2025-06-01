import { useRef } from 'react';
import { NEVER } from './utils/lang.js';

/**
 * Calls a {@link fn function} during initial render and caches its result until component is unmounted.
 *
 * @param fn A function to call.
 * @param args Function arguments.
 * @returns A function return value, or a cached return value.
 * @template A Function arguments.
 * @template R A function return value.
 * @see {@link useFunction}
 * @see {@link useFunctionEffect}
 * @group Other
 */
export function useFunctionOnce<A extends any[], R>(fn: (...args: A) => R, ...args: A): R;

export function useFunctionOnce(fn: Function) {
  const ref = useRef<unknown>(NEVER);

  if (ref.current !== NEVER) {
    return ref.current;
  }

  if (arguments.length === 1) {
    return (ref.current = fn());
  }

  if (arguments.length === 2) {
    return (ref.current = fn(arguments[1]));
  }

  const args = [];

  for (let i = 1; i < arguments.length; ++i) {
    args.push(arguments[i]);
  }

  return (ref.current = fn(...args));
}
