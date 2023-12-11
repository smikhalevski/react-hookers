import { DependencyList } from 'react';
import { useSemanticMemo } from './useSemanticMemo';

/**
 * The drop-in replacement for {@link https://reactjs.org/docs/hooks-reference.html#usecallback React.useCallback}
 * which provides the semantic guarantee that the callback won't be "forgotten" until the hook is unmounted.
 */
export function useSemanticCallback<T extends (...args: any[]) => any>(cb: T, deps?: DependencyList): T {
  return useSemanticMemo(() => cb, deps);
}
