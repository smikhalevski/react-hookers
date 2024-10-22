import { EffectCallback, useLayoutEffect } from 'react';
import type { Schedule } from './types';
import { useFunction } from './useFunction';
import { emptyArray } from './utils';

/**
 * Returns the protocol that delays invoking a callback until after a timeout.
 *
 * The delayed invocation is automatically cancelled on unmount.
 *
 * The timeout should be started/stopped after the component is mounted. Before that, it is a no-op.
 */
export function useTimeout(): [schedule: Schedule, cancel: () => void] {
  const manager = useFunction(createTimeoutManager);

  useLayoutEffect(manager.onMounted, emptyArray);

  return [manager.schedule, manager.cancel];
}

interface TimeoutManager {
  schedule: Schedule;
  cancel: () => void;
  onMounted: EffectCallback;
}

function createTimeoutManager(): TimeoutManager {
  let isMounted = false;
  let timer: NodeJS.Timeout;

  const schedule: Schedule = (cb, ms, ...args) => {
    if (!isMounted) {
      return;
    }

    cancel();

    timer = setTimeout(cb, ms, ...args);
  };

  const cancel = () => clearTimeout(timer);

  const handleMounted: EffectCallback = () => {
    isMounted = true;

    return () => {
      isMounted = false;
      cancel();
    };
  };

  return {
    schedule,
    cancel,
    onMounted: handleMounted,
  };
}
