import {emptyDeps} from '../utils';
import {AsyncEffectCallback, useAsyncEffect} from './useAsyncEffect';

/**
 * Same as {@link useAsyncEffect} but calls effect only once after the component is mounted.
 *
 * The optional cleanup callback is called when the component is unmounted.
 *
 * @see {@link https://reactjs.org/docs/hooks-reference.html#useeffect React.useEffect}
 */
export function useAsyncEffectOnce(effect: AsyncEffectCallback): void {
  useAsyncEffect(effect, emptyDeps);
}
