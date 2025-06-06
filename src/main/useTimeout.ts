import { EffectCallback, useLayoutEffect } from 'react';
import type { Schedule } from './types.js';
import { useFunctionOnce } from './useFunctionOnce.js';
import { emptyArray } from './utils/lang.js';

/**
 * Returns the protocol that delays invoking a callback until after a timeout.
 *
 * The delayed invocation is automatically cancelled on unmount.
 *
 * The timeout should be started/stopped after the component is mounted. Before that, it is a no-op.
 *
 * @example
 * const [schedule, cancel] = useTimeout();
 *
 * useEffect(() => {
 *   // Cancels pending debounce and schedules the new call
 *   schedule(
 *     (a, b) => {
 *       doSomething(a, b);
 *     },
 *     500, // Timeout after which the callback is called
 *     a, b, // Varargs that are passed to the callback
 *   );
 *
 *   // Cancels the last debounce call
 *   cancel();
 * }, []);
 *
 * @group Other
 */
export function useTimeout(): [schedule: Schedule, cancel: () => void] {
  const manager = useFunctionOnce(createTimeoutManager);

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
  let timer: number;

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
