import { useLayoutEffect } from 'react';

/**
 * Calls {@link fn a function} in a layout effect if any of its {@link args} have changed between renders. If function
 * has no args it is called only once after the first render.
 *
 * @param fn A function to call.
 * @param args Function arguments.
 * @template A Function arguments.
 */
export function useFunctionEffect<A extends any[]>(fn: (...args: A) => (() => void) | void, ...args: A): void {
  useLayoutEffect(() => fn(...args), args);
}
