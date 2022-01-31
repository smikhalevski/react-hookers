import {EffectCallback, useRef} from 'react';
import {useEffectOnce} from '../effect';

/**
 * Returns `AbortSignal` that is aborted when the component is unmounted.
 */
export function useMountSignal(): AbortSignal {
  const manager = useRef<ReturnType<typeof createMountSignalManager>>().current ||= createMountSignalManager();

  useEffectOnce(manager.__effect);

  return manager.__signal;
}

function createMountSignalManager() {
  const abortController = new AbortController();

  const __effect: EffectCallback = () => () => {
    abortController.abort();
  };

  return {
    __effect,
    __signal: abortController.signal,
  };
}
