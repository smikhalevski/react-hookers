import { useRef } from 'react';
import { isEqual } from './utils/lang';

/**
 * Calls a {@link fn function} during render if any of its {@link args} have changed between renders.
 *
 * @param fn A function to call.
 * @param args Function arguments.
 * @returns A function return value, or a cached return value if {@link args} didn't change.
 * @template A Function arguments.
 * @template R A function return value.
 * @see {@link useFunctionOnce}
 * @see {@link useFunctionEffect}
 * @group Other
 */
export function useFunction<A extends any[], R>(fn: (...args: A) => R, ...args: A): R;

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
