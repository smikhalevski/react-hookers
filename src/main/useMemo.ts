import {DependencyList, useRef} from 'react';
import {createMemoHook} from './createMemoHook';

/**
 * A semantic guarantee drop-in replacement for `React.useMemo`. It guarantees that the value produced by `factory`
 * won't ever be "forgotten" until the hook is unmounted.
 */
export function useMemo<T>(factory: () => T, deps: DependencyList | undefined): T {
  const hook = useRef<ReturnType<typeof createMemoHook>>().current ||= createMemoHook(false);
  return hook(factory, deps);
}
