import { EffectCallback, useEffect, useReducer } from 'react';
import { useFunction } from './useFunction';
import { emptyArray, noop } from './utils';

/**
 * Returns a callback that triggers a component re-render. Re-render callback can be safely invoked at any time of the
 * component lifecycle. Returned callback doesn't change between hook invocations.
 *
 * **Note:** Using this hook makes your code imperative, which is generally considered a bad practice.
 */
export function useRerender(): () => void {
  const [, dispatch] = useReducer(reduceCount, 0);

  const manager = useFunction(createRerenderManager, dispatch);

  useEffect(manager.onComponentMounted, emptyArray);

  return manager.rerender;
}

function reduceCount(count: number): number {
  return count + 1;
}

interface RerenderManager {
  rerender: () => void;
  onComponentMounted: EffectCallback;
}

function createRerenderManager(dispatch: () => void): RerenderManager {
  let handleRerender = dispatch;

  const handleComponentMounted: EffectCallback = () => {
    handleRerender = dispatch;

    return () => {
      handleRerender = noop;
    };
  };

  return {
    rerender(): void {
      handleRerender();
    },
    onComponentMounted: handleComponentMounted,
  };
}
