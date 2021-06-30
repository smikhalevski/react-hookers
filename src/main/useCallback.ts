import React from 'react';
import {createMemoHook} from './createMemoHook';

/**
 * A drop-in replacement for `React.useCallback`, that is a semantic guarantee. It guarantees that the `callback` won't
 * ever be "forgotten" until the hook is unmounted.
 */
export function useCallback<T>(cb: () => T, deps: React.DependencyList | undefined): T {
  const hook = React.useRef<ReturnType<typeof createMemoHook>>().current ||= createMemoHook(true);
  return hook(cb, deps);
}
