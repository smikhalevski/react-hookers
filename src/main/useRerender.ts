import React from 'react';

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
  const [, triggerRerender] = React.useReducer(reducer, 0);

  const manager = React.useRef<ReturnType<typeof createRerenderManager>>().current ||= createRerenderManager(triggerRerender);

  manager.preventRerender();
  React.useEffect(manager.effect);

  return manager.rerender;
}

const reducer: React.ReducerWithoutAction<number> = (prevState) => prevState ^ 1;

const enum RerenderState {
  IDLE,
  DEFERRED,
  PREVENTED,
}

function createRerenderManager(triggerRerender: () => void) {

  let state = RerenderState.IDLE;

  const preventRerender = (): void => {
    if (state === RerenderState.IDLE) {
      state = RerenderState.PREVENTED;
    }
  };

  const rerender = (force?: boolean): void => {
    if (state === RerenderState.IDLE) {
      triggerRerender();
    } else if (force) {
      state = RerenderState.DEFERRED;
    }
  };

  const effect: React.EffectCallback = () => {
    if (state === RerenderState.DEFERRED) {
      triggerRerender();
    }
    state = RerenderState.IDLE;
    return preventRerender;
  };

  return {
    preventRerender,
    rerender,
    effect,
  };
}
