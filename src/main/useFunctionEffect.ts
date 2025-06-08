import { useEffect } from 'react';

/**
 * Calls a function in an effect if any of its arguments have changed between renders.
 *
 * @param fn A function to call.
 * @param args Function arguments.
 * @template A Function arguments.
 * @group Other
 */
export function useFunctionEffect<A extends any[]>(fn: (...args: A) => (() => void) | void, ...args: A): void {
  useEffect(() => fn(...args), args);
}
