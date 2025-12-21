import { EffectCallback, useLayoutEffect } from 'react';
import type { Schedule } from './types.js';
import { useFunctionOnce } from './useFunctionOnce.js';
import { emptyArray } from './utils/lang.js';

/**
 * Returns an API that delays invoking a callback until after a timeout.
 *
 * The delayed invocation is automatically cancelled when the component unmounts.
 *
 * The timeout should be started or stopped only after the component has mounted.
 * Before that, calling either function is a no-op.
 *
 * @example
 * const [schedule, cancel] = useTimeout();
 *
 * useEffect(() => {
 *   // Cancels any pending timeout and schedules a new call
 *   schedule(
 *     (a, b) => {
 *       doSomething(a, b);
 *     },
 *     500, // Timeout delay in milliseconds
 *     a, b, // Arguments passed to the callback
 *   );
 *
 *   // Cancels the last scheduled call
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
