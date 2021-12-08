import {DependencyList, EffectCallback, useEffect} from 'react';

const NO_DEPS: DependencyList = [];

/**
 * Same as `React.useEffect` but calls `effect` only once after the component is mounted.
 */
export function useEffectOnce(effect: EffectCallback): void {
  useEffect(effect, NO_DEPS);
}
