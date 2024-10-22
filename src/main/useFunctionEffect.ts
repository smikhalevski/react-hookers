import { useEffect } from 'react';

/**
 * Calls {@link fn a function} in a layout effect if any of its {@link args} have changed between renders.
 *
 * @param fn A function to call.
 * @param args Function arguments.
 * @template A Function arguments.
 * @group Other
 */
export function useFunctionEffect<A extends any[]>(fn: (...args: A) => (() => void) | void, ...args: A): void {
  useEffect(() => fn(...args), args);
}
