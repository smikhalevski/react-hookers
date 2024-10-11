/**
 * Schedules a timed invocation of the callback with provided arguments.
 *
 * @param cb The callback to invoke.
 * @param ms The delay after which the callback must be invoked.
 * @param args Varargs that are passed as arguments to the callback.
 * @template A The callback arguments.
 */
export type Schedule = <A extends any[]>(cb: (...args: A) => void, ms: number, ...args: A) => void;

export const emptyArray = [];

export function noop(): void {}

/**
 * [SameValueZero](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero) comparison.
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}
