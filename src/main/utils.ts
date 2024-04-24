import { DependencyList } from 'react';

/**
 * Schedules a timed invocation of the callback with provided arguments.
 *
 * @param cb The callback to invoke.
 * @param ms The delay after which the callback must be invoked.
 * @param args Varargs that are passed as arguments to the callback.
 * @template A The callback arguments.
 */
export type Schedule = <A extends any[]>(cb: (...args: A) => void, ms: number, ...args: A) => void;

export const emptyDeps: DependencyList = [];

export function noop(): void {}
