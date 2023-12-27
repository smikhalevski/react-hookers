import { DependencyList } from 'react';

export const emptyDeps: DependencyList = [];

export function noop(): void {}

/**
 * [SameValueZero](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero) comparison.
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function assert(condition: unknown, message: string): asserts condition is true {
  if (!condition) {
    throw new Error(message);
  }
}
