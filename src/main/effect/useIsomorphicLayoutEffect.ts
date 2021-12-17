import {DependencyList, EffectCallback, useLayoutEffect} from 'react';

/**
 * Drop-in replacement for `React.useLayoutEffect` that doesn't produce warnings during SSR.
 */
export function useIsomorphicLayoutEffect(effect: EffectCallback, deps?: DependencyList): void {
  if (typeof window !== 'undefined') {
    useLayoutEffect(effect, deps);
  }
}
