import { DependencyList, useRef } from 'react';
import { areHookInputsEqual } from './areHookInputsEqual';
import { emptyDeps } from './utils';

/**
 * Recompute the memoized value when one of the deps has changed.
 *
 * The drop-in replacement for `React.useMemo` which provides the semantic guarantee that the value produced by factory
 * won't be "forgotten" until the hook is unmounted.
 *
 * @param factory The callback that returns the memoized value.
 * @param deps The array of dependencies or `undefined` if memoized value should never be updated.
 * @template T The memoized value.
 */
export function useSemanticMemo<T>(factory: () => T, deps = emptyDeps): T {
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
