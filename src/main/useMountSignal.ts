import {DependencyList, EffectCallback, useEffect, useRef} from 'react';

const NO_DEPS: DependencyList = [];

/**
 * Returns `AbortSignal` that is aborted when the component is unmounted.
 */
export function useMountSignal(): AbortSignal {
  const manager = useRef<ReturnType<typeof createMountSignalManager>>().current ||= createMountSignalManager();

  useEffect(manager.effect, NO_DEPS);

  return manager.signal;
}

function createMountSignalManager() {
  const abortController = new AbortController();

  const effect: EffectCallback = () => () => abortController.abort();

  return {
    effect,
    signal: abortController.signal,
  };
}
