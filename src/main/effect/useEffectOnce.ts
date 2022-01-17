import {EffectCallback, useEffect} from 'react';
import {emptyDeps} from '../utils';

/**
 * Same as `React.useEffect` but calls effect only once after the component is mounted.
 *
 * The optional cleanup callback is called when the component is unmounted.
 *
 * @see {@link https://reactjs.org/docs/hooks-reference.html#useeffect React.useEffect}
 * @see {@link useRenderEffect}
 */
export function useEffectOnce(effect: EffectCallback): void {
  useEffect(effect, emptyDeps);
}
