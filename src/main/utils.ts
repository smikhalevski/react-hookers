import { ValueOrProvider } from './types';

export const emptyObject = Object.freeze({});

export const emptyArray = Object.freeze([]);

export function noop() {}

/**
 * Unwraps a provided value.
 *
 * @param value A value or a value provider callback.
 * @param args Arguments of a value provider callback.
 * @returns An unwrapped value.
 * @template T An unwrapped value.
 * @template A Arguments of a callback that return a value.
 */
export function callOrGet<T, A extends any[]>(value: ValueOrProvider<T, A>, ...args: A): T;

export function callOrGet(value: unknown) {
  if (typeof value !== 'function') {
    return value;
  }

  if (arguments.length === 1) {
    return value();
  }

  if (arguments.length === 2) {
    return value(arguments[1]);
  }

  const args = [];

  for (let i = 1; i < arguments.length; ++i) {
    args.push(arguments[i]);
  }

  return value(...args);
}

export function die(message?: string): never {
  throw new Error(message);
}

/**
 * [SameValueZero](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero) comparison.
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}
