import { DependencyList } from 'react';
import { areHookInputsEqual } from '../areHookInputsEqual';

export type SemanticMemoHook = (cb: () => unknown, deps: DependencyList | undefined) => any;

export function createSemanticMemoHook(callable: boolean): SemanticMemoHook {
  let prevDeps: DependencyList | undefined;
  let value: any;

  return (cb, deps) => {
    if (areHookInputsEqual(deps, prevDeps)) {
      return value;
    }
    prevDeps = deps;
    return (value = callable ? cb : cb());
  };
}
