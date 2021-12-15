import {EffectCallback, useRef} from 'react';
import {useEffectOnce} from './effect';

/**
 * Returns `AbortSignal` that is aborted when the component is unmounted.
 */
export function useMountSignal(): AbortSignal {
  const manager = useRef<ReturnType<typeof createMountSignalManager>>().current ||= createMountSignalManager();

  useEffectOnce(manager._effect);

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
