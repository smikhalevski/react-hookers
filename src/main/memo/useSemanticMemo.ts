import { DependencyList, useRef } from 'react';
import { createSemanticMemoHook, SemanticMemoHook } from './createSemanticMemoHook';

/**
 * The drop-in replacement for `React.useMemo` which provides the semantic guarantee that the value produced by factory
 * won't be "forgotten" until the hook is unmounted.
 *
 * @see {@link https://reactjs.org/docs/hooks-reference.html#usememo React.useMemo}
 */
export function useSemanticMemo<T>(factory: () => T, deps?: DependencyList): T {
  const hook = (useRef<SemanticMemoHook>().current ||= createSemanticMemoHook(false));
  return hook(factory, deps);
}
