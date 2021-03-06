import {EffectCallback} from 'react';
import {useRenderEffect} from './useRenderEffect';
import {emptyDeps} from '../utils';

/**
 * Same as {@link useRenderEffectOnce} but calls effect only once after the component is mounted.
 *
 * The optional cleanup callback is called when the component is unmounted.
 *
 * @see {@link https://reactjs.org/docs/hooks-reference.html#useeffect React.useEffect}
 */
export function useRenderEffectOnce(effect: EffectCallback): void {
  useRenderEffect(effect, emptyDeps);
}
