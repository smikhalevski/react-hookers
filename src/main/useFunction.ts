import { useRef } from 'react';
import { isEqual } from './utils';

/**
 * Calls {@link fn a function} if any of its {@link args} have changed between renders. If function has no args it is
 * called only once during the first render.
 *
 * @param fn A function to call.
 * @param args Function arguments.
 * @returns A function return value, or a cached return value if {@link args} didn't change.
 * @template T A function return value.
 * @template A Function arguments.
 */
export function useFunction<T, A extends any[]>(fn: (...args: A) => T, ...args: A): T;

export function useFunction(fn: Function) {
  const ref = useRef<unknown[]>();

  let hasChanged;
  let args = ref.current;

  if ((hasChanged = args === undefined || args.length !== arguments.length)) {
    args = ref.current = [undefined];
  }

  for (let i = 1; i < arguments.length; ++i) {
    if (hasChanged || (hasChanged = !isEqual(args[i], arguments[i]))) {
      args[i] = arguments[i];
    }
  }

  if (hasChanged) {
    args[0] = args.length === 1 ? fn() : fn(...args.slice(1));
  }

  return args[0];
}
