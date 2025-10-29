export const NEVER = {} as never;

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
 * @group Other
 */
export function callOrGet<T, A extends any[]>(value: T | ((...args: A) => T), ...args: A): T;

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

/**
 * [SameValueZero](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero) comparison.
 *
 * @group Other
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}

/**
 * Creates an array of given length and fills it with a value.
 *
 * @example
 * // Create a array of 3 element refs
 * const refs = useFunction(arrayOf, 3, createRef<Element>);
 *
 * @param length The length of the array.
 * @param value A value or a value provider callback.
 * @returns An array.
 * @template T A value stored in an array.
 * @group Other
 */
export function arrayOf<T = any>(length: number, value?: T | ((index: number) => T)): T[] {
  const values: any[] = [];

  for (let i = 0; i < length; ++i) {
    values.push(callOrGet(value, i));
  }

  return values;
}
