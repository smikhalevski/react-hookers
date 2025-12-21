import { useEffect } from 'react';

/**
 * Calls a function in an effect when any of its arguments have changed since the previous render.
 *
 * @param fn The function to call.
 * @param args The function arguments.
 * @template A The function arguments.
 * @group Other
 */
export function useFunctionEffect<A extends any[]>(fn: (...args: A) => (() => void) | void, ...args: A): void {
  useEffect(() => fn(...args), args);
}
