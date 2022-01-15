import {EffectCallback, ReducerWithoutAction, useReducer, useRef} from 'react';
import {useEffectOnce} from '../effect';

/**
 * Returns a callback that triggers a component re-render. Re-render callback can be safely invoked at any time of the
 * component life cycle. Returned callback doesn't change between hook invocations.
 *
 * **Note:** Using this hook makes you code imperative, which is generally considered a bad practice.
 */
export function useRerender(): () => void {
  const [, dispatch] = useReducer(reduceCount, 0);

  const manager = useRef<ReturnType<typeof createRerenderManager>>().current ||= createRerenderManager(dispatch);

  useEffectOnce(manager._effect);

  return manager._rerender;
}

const reduceCount: ReducerWithoutAction<number> = (count) => count + 1;

function createRerenderManager(dispatch: () => void) {

  let mounted = true;

  const _rerender = (): void => {
    if (mounted) {
      dispatch();
    }
  };

  const _effect: EffectCallback = () => () => {
    mounted = false;
  };

  return {
    _rerender,
    _effect,
  };
}
