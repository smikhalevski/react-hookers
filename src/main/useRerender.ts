import { EffectCallback, useReducer, useRef } from 'react';
import { emptyDeps, noop } from './utils';
import { useInsertionEffect } from './useInsertionEffect';

/**
 * Returns a callback that triggers a component re-render. Re-render callback can be safely invoked at any time of the
 * component lifecycle. Returned callback doesn't change between hook invocations.
 *
 * **Note:** Using this hook makes your code imperative, which is generally considered a bad practice.
 */
export function useRerender(): () => void {
  const [, dispatch] = useReducer(reduceCount, 0);

  const manager = (useRef<ReturnType<typeof createRerenderManager>>().current ||= createRerenderManager(dispatch));

  useInsertionEffect(manager.effect, emptyDeps);

  return manager.rerender;
}

function reduceCount(count: number) {
  return count + 1;
}

function createRerenderManager(dispatch: () => void) {
  let doRerender = dispatch;

  const effect: EffectCallback = () => {
    doRerender = dispatch;

    return () => {
      doRerender = noop;
    };
  };

  return {
    effect,
    rerender(): void {
      doRerender();
    },
  };
}
