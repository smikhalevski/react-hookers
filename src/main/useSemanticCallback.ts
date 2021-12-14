import {DependencyList, useRef} from 'react';
import {createSemanticMemoHook, SemanticMemoHook} from './createSemanticMemoHook';

/**
 * A semantic guarantee drop-in replacement for `React.useCallback`. It guarantees that the `cb` won't be "forgotten"
 * until the hook is unmounted.
 */
export function useSemanticCallback<T extends (...args: unknown[]) => unknown>(cb: T, deps?: DependencyList): () => T {
  const hook = useRef<SemanticMemoHook>().current ||= createSemanticMemoHook(true);
  return hook(cb, deps);
}
