import {DependencyList} from 'react';

export const emptyDeps: DependencyList = [];

export function noop() {
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}
