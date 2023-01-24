import { DependencyList, useRef } from 'react';
import { createSemanticMemoHook, SemanticMemoHook } from './createSemanticMemoHook';

/**
 * The drop-in replacement for {@linkcode https://reactjs.org/docs/hooks-reference.html#usememo React.useMemo} which
 * provides the semantic guarantee that the value produced by factory won't be "forgotten" until the hook is unmounted.
 */
export function useSemanticMemo<T>(factory: () => T, deps?: DependencyList): T {
  return (useRef<SemanticMemoHook>().current ||= createSemanticMemoHook(false))(factory, deps);
}
