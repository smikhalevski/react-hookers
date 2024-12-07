import { useRef } from 'react';
import { NEVER } from './utils/lang';

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
