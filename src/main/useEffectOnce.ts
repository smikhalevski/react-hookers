import {EffectCallback, useEffect} from 'react';
import {emptyDeps} from './utils';

/**
 * Same as `React.useEffect` but calls `effect` only once after the component is mounted.
 *
 * @see https://reactjs.org/docs/hooks-reference.html#useeffect React.useEffect
 * @see useRenderEffect
 */
export function useEffectOnce(effect: EffectCallback): void {
  useEffect(effect, emptyDeps);
}
