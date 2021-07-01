import React from 'react';
import {createMemoHook} from './createMemoHook';

/**
 * A semantic guarantee drop-in replacement for `React.useMemo`. It guarantees that the value produced by `factory`
 * won't ever be "forgotten" until the hook is unmounted.
 */
export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T {
  const hook = React.useRef<ReturnType<typeof createMemoHook>>().current ||= createMemoHook(false);
  return hook(factory, deps);
}
