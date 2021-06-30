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
 * Using this hook makes you code imperative, which is a bad practice in most cases. It is recommended to use it only
 * with subscription-based updates that are initiated during render (may be required for SSR) and animations.
 */
export function useRerender(): (force?: boolean) => void {
  const [, triggerRerender] = React.useReducer(xor, 0);

  const manager = React.useRef<ReturnType<typeof createManager>>().current ||= createManager(triggerRerender);

  manager.prevent();
  React.useEffect(manager.effect);

  return manager.rerender;
}

const xor = (x: number) => x ^ 1;

const enum Phase {IDLE, DEFERRED, PREVENTED}

function createManager(triggerRerender: () => void) {

  let phase = Phase.IDLE;

  const prevent = (): void => {
    if (phase === Phase.IDLE) {
      phase = Phase.PREVENTED;
    }
  };

  const rerender = (force?: boolean): void => {
    if (phase === Phase.IDLE) {
      triggerRerender();
    } else if (force) {
      phase = Phase.DEFERRED;
    }
  };

  const effect: React.EffectCallback = () => {
    if (phase === Phase.DEFERRED) {
      triggerRerender();
    }
    phase = Phase.IDLE;
    return prevent;
  };

  return {
    prevent,
    rerender,
    effect,
  };
}
