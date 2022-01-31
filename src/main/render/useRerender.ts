import {EffectCallback, useReducer, useRef} from 'react';
import {useEffectOnce} from '../effect';

/**
 * Returns a callback that triggers a component re-render. Re-render callback can be safely invoked at any time of the
 * component life cycle. Returned callback doesn't change between hook invocations.
 *
 * **Note:** Using this hook makes your code imperative, which is generally considered a bad practice.
 */
export function useRerender(): () => void {
  const [, dispatch] = useReducer(reduceCount, 0);

  const manager = useRef<ReturnType<typeof createRerenderManager>>().current ||= createRerenderManager(dispatch);

  useEffectOnce(manager.__effect);

  return manager.__rerender;
}

function reduceCount(count: number) {
  return count + 1;
}

function createRerenderManager(dispatch: () => void) {

  let mounted = true;

  const __rerender = (): void => {
    if (mounted) {
      dispatch();
    }
  };

  const __effect: EffectCallback = () => () => {
    mounted = false;
  };

  return {
    __rerender,
    __effect,
  };
}
