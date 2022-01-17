import {DependencyList, useRef} from 'react';
import {createSemanticMemoHook, SemanticMemoHook} from './createSemanticMemoHook';

/**
 * The drop-in replacement for `React.useCallback` which provides the semantic guarantee that the callback won't be
 * "forgotten" until the hook is unmounted.
 *
 * @see {@link https://reactjs.org/docs/hooks-reference.html#usecallback React.useCallback}
 */
export function useSemanticCallback<T extends (...args: any[]) => any>(cb: T, deps?: DependencyList): () => T {
  const hook = useRef<SemanticMemoHook>().current ||= createSemanticMemoHook(true);
  return hook(cb, deps);
}
