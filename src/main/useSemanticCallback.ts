import { DependencyList } from 'react';
import { useSemanticMemo } from './useSemanticMemo';

/**
 * Return a memoized version of the callback that only changes if one of the `deps` has changed.
 *
 * The drop-in replacement for `React.useCallback` which provides the semantic guarantee that the callback won't be
 * "forgotten" until the hook is unmounted.
 *
 * @param cb The callback to memoize.
 * @param deps The array of dependencies or `undefined` if memoized value should never be updated.
 * @template T The callback to memoize.
 * @see {@link useHandler}
 */
export function useSemanticCallback<T extends (...args: any[]) => any>(cb: T, deps?: DependencyList): T {
  return useSemanticMemo(() => cb, deps);
}
