import {EffectCallback, ReducerWithoutAction, useEffect, useReducer, useRef} from 'react';

/**
 * Returns a callback that triggers a component re-render.
 *
 * Re-render callback can be safely invoked at any time of the component life cycle. By default, if a component is
 * being rendered at the time of re-render callback invocation then re-render is ignored. If `force` is set to `true`
 * then re-render is deferred and triggered after current render completes.
 *
 * Returned callback doesn't change between hook invocations.
 *
 * Using this hook makes you code imperative, which is a bad practice in most cases.
 */
export function useRerender(): (force?: boolean) => void {
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

  const _rerender = (force?: boolean): void => {
    if (state === RerenderState.IDLE) {
      triggerRerender();
    } else if (force) {
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
