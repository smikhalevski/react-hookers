import { DependencyList, useRef } from 'react';
import { areHookInputsEqual } from './areHookInputsEqual';

/**
 * The drop-in replacement for {@link https://reactjs.org/docs/hooks-reference.html#usememo React.useMemo} which
 * provides the semantic guarantee that the value produced by factory won't be "forgotten" until the hook is unmounted.
 */
export function useSemanticMemo<T>(factory: () => T, deps?: DependencyList): T {
  return (useRef<ReturnType<typeof createSemanticMemoHook<T>>>().current ||= createSemanticMemoHook())(factory, deps);
}

function createSemanticMemoHook<T>(): (cb: () => T, deps: DependencyList | undefined) => T {
  let prevDeps: DependencyList | undefined;
  let value: T;

  return (cb, deps) => {
    if (areHookInputsEqual(deps, prevDeps)) {
      return value;
    }
    prevDeps = deps;
    value = cb();
    return value;
  };
}
