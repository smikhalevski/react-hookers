export const NEVER = {} as never;

export const emptyObject = Object.freeze({});

export const emptyArray = Object.freeze([]);

export function noop() {}

/**
 * Unwraps a provided value.
 *
 * If the value is a function, it is invoked with the provided arguments and its return value is returned.
 * Otherwise, the value itself is returned.
 *
 * @param value A value or a value-provider callback.
 * @param args Arguments passed to the value-provider callback.
 * @returns The unwrapped value.
 * @template T The unwrapped value type.
 * @template A The argument types of the value-provider callback.
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
 * Performs a [SameValueZero](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero) comparison.
 *
 * @group Other
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}

/**
 * Creates an array of the given length and fills it with a value.
 *
 * @example
 * // Create an array of 3 element refs
 * const refs = useFunction(arrayOf, 3, createRef<Element>);
 *
 * @param length The length of the array.
 * @param value A value or a value-provider callback.
 * @returns The created array.
 * @template T The type of values stored in the array.
 * @group Other
 */
export function arrayOf<T = any>(length: number, value?: T | ((index: number) => T)): T[] {
  const values: any[] = [];

  for (let i = 0; i < length; ++i) {
    values.push(callOrGet(value, i));
  }

  return values;
}
