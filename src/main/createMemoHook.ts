import {DependencyList} from 'react';
import {areHookInputsEqual} from './areHookInputsEqual';

export function createMemoHook(callable: boolean): (factory: () => any, deps: DependencyList | undefined) => any {

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
