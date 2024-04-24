import { DependencyList } from 'react';

export type Schedule = <A extends any[]>(cb: (...args: A) => void, ms: number, ...args: A) => void;

export const emptyDeps: DependencyList = [];

export function noop(): void {}
