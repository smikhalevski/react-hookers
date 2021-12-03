import {DependencyList, useMemo} from 'react';
import {areHookInputsEqual} from './areHookInputsEqual';

export type SemanticMemoHook = typeof useMemo;

export function createSemanticMemoHook(callable: boolean): SemanticMemoHook {

  let prevDeps: DependencyList | undefined;
  let value: any;

  return (factory, deps) => {
    if (areHookInputsEqual(deps, prevDeps)) {
      return value;
    }
    prevDeps = deps;
    return value = callable ? factory : factory();
  };
}
