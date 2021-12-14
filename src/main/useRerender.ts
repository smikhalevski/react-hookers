import {EffectCallback, ReducerWithoutAction, useEffect, useReducer, useRef} from 'react';

/**
 * Returns a callback that triggers a component re-render. Re-render callback can be safely invoked at any time of the
 * component life cycle. Returned callback doesn't change between hook invocations.
 *
 * **Note:** Using this hook makes you code imperative, which is a bad practice in most cases.
 */
export function useRerender(): () => void {
  const [, triggerRerender] = useReducer(reducer, 0);

  const manager = useRef<ReturnType<typeof createRerenderManager>>().current ||= createRerenderManager(triggerRerender);

  manager._preventRerender();
  useEffect(manager._effect);

  return manager._rerender;
}

const reducer: ReducerWithoutAction<number> = (prevState) => prevState ^ 1;

const enum RerenderState {
  IDLE,
  DEFERRED,
  PREVENTED,
}

function createRerenderManager(triggerRerender: () => void) {

  let state = RerenderState.IDLE;

  const _preventRerender = (): void => {
    if (state === RerenderState.IDLE) {
      state = RerenderState.PREVENTED;
    }
  };

  const _rerender = (): void => {
    if (state === RerenderState.IDLE) {
      triggerRerender();
    } else {
      state = RerenderState.DEFERRED;
    }
  };

  const _effect: EffectCallback = () => {
    if (state === RerenderState.DEFERRED) {
      triggerRerender();
    }
    state = RerenderState.IDLE;
    return _preventRerender;
  };

  return {
    _preventRerender,
    _rerender,
    _effect,
  };
}
