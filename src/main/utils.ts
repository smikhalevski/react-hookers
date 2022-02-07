import {DependencyList} from 'react';

export const emptyDeps: DependencyList = [];

export function noop() {
}

export function returnFalse() {
  return false;
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}
