import { useRef } from 'react';

/**
 * Calls a function during render if any of its arguments have changed since the previous render.
 *
 * @param fn The function to call.
 * @param args The function arguments.
 * @returns The function's return value, or a cached return value if the arguments did not change.
 * @template A The function arguments.
 * @template R The function return value.
 * @see {@link useFunctionOnce}
 * @see {@link useFunctionEffect}
 * @group Other
 */
export function useFunction<A extends any[], R>(fn: (...args: A) => R, ...args: A): R;

export function useFunction(fn: Function) {
  const cacheRef = useRef<unknown[]>(null);

  let hasChanged;
  let args = cacheRef.current;

  if ((hasChanged = args === null || args.length !== arguments.length)) {
    args = cacheRef.current = [undefined];
  }

  for (let i = 1; i < arguments.length; ++i) {
    if (hasChanged || (hasChanged = !Object.is(args[i], arguments[i]))) {
      args[i] = arguments[i];
    }
  }

  if (hasChanged) {
    args[0] = args.length === 1 ? fn() : fn(...args.slice(1));
  }

  return args[0];
}
