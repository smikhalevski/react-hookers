import {DependencyList, EffectCallback, useEffect, useRef} from 'react';

const NO_DEPS: DependencyList = [];

/**
 * Returns `AbortSignal` that is aborted when the component is unmounted.
 */
export function useMountSignal(): AbortSignal {
  const manager = useRef<ReturnType<typeof createMountSignalManager>>().current ||= createMountSignalManager();

  useEffect(manager._effect, NO_DEPS);

  return manager._signal;
}

function createMountSignalManager() {
  const abortController = new AbortController();

  const _effect: EffectCallback = () => () => abortController.abort();

  return {
    _effect,
    _signal: abortController.signal,
  };
}
