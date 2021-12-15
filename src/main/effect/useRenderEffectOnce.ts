import {EffectCallback} from 'react';
import {useRenderEffect} from './useRenderEffect';
import {emptyDeps} from '../utils';

/**
 * Same as {@link useRenderEffect} but calls `effect` only once during the first render.
 *
 * @see https://reactjs.org/docs/hooks-reference.html#useeffect React.useEffect
 * @see useRenderEffect
 */
export function useRenderEffectOnce(effect: EffectCallback): void {
  useRenderEffect(effect, emptyDeps);
}
