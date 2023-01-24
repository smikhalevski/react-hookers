import { DependencyList, useRef } from 'react';
import { createSemanticMemoHook, SemanticMemoHook } from './createSemanticMemoHook';

/**
 * The drop-in replacement for {@linkcode https://reactjs.org/docs/hooks-reference.html#usecallback React.useCallback}
 * which provides the semantic guarantee that the callback won't be "forgotten" until the hook is unmounted.
 */
export function useSemanticCallback<T extends (...args: any[]) => any>(cb: T, deps?: DependencyList): () => T {
  return (useRef<SemanticMemoHook>().current ||= createSemanticMemoHook(true))(cb, deps);
}
