import React from 'react';
import {isEqualArrays} from './isEqualArrays';

export function createMemoHook(callable: boolean): (factory: () => any, deps: React.DependencyList | undefined) => any {

  let prevDeps: React.DependencyList | undefined;
  let value: any;

  return (factory, deps) => {
    if (prevDeps != null && deps != null && isEqualArrays(prevDeps, deps)) {
      return value;
    }
    prevDeps = deps;
    return value = callable ? factory : factory();
  };
}
