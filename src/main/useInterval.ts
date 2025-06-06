import { EffectCallback, useLayoutEffect } from 'react';
import type { Schedule } from './types.js';
import { useFunctionOnce } from './useFunctionOnce.js';
import { emptyArray, noop } from './utils/lang.js';

/**
 * The replacement for `window.setInterval` that schedules a function to be repeatedly called with a fixed time delay
 * between each call. Interval is cancelled when component is unmounted or when a new interval is scheduled.
 *
 * All functions that were scheduled with the same delay are invoked synchronously across all components that use this
 * hook.
 *
 * Intervals must be scheduled/canceled after the component is mounted. Before that, it is a no-op.
 *
 * @example
 * const [schedule, cancel] = useInterval();
 *
 * useEffect(() => {
 *   // Cancels currently scheduled callback and schedules the new one
 *   schedule(
 *     (a, b) => {
 *       doSomething(a, b);
 *     },
 *     500, // Interval delay
 *     a, b, // Varargs that are passed to the callback
 *   );
 *
 *   // Stops invoking the callback that was last provided to schedule()
 *   cancel();
 * }, []);
 *
 * @see {@link useRerenderInterval}
 * @group Other
 */
export function useInterval(): [schedule: Schedule, cancel: () => void] {
  const manager = useFunctionOnce(createIntervalManager);

  useLayoutEffect(manager.onMounted, emptyArray);

  return [manager.schedule, manager.cancel];
}

interface IntervalManager {
  schedule: Schedule;
  cancel: () => void;
  onMounted: EffectCallback;
}

function createIntervalManager(): IntervalManager {
  let isMounted = false;
  let abort = noop;

  const schedule: Schedule = (cb, ms, ...args) => {
    if (!isMounted) {
      return;
    }

    cancel();

    abort = getOrCreateScheduler(ms)(() => {
      cb(...args);
    });
  };

  const cancel = (): void => {
    abort();
    abort = noop;
  };

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

const schedulers = new Map<number, ReturnType<typeof getOrCreateScheduler>>();

function getOrCreateScheduler(ms: number): (cb: () => void) => () => void {
  let timer: number;
  let scheduler = schedulers.get(ms);

  if (scheduler !== undefined) {
    return scheduler;
  }

  const callbacks: Array<() => void> = [];

  const next = () => {
    for (let i = 0; i < callbacks.length; ++i) {
      const cb = callbacks[i];

      try {
        cb();
      } catch (error) {
        setTimeout(() => {
          // Force uncaught exception
          throw error;
        }, 0);
      }
    }

    timer = setTimeout(next, ms);
  };

  scheduler = cb => {
    if (callbacks.indexOf(cb) === -1 && callbacks.push(cb) === 1) {
      timer = setTimeout(next, ms);
    }

    return () => {
      const index = callbacks.indexOf(cb);

      if (index !== -1 && (callbacks.splice(index, 1), callbacks.length === 0)) {
        schedulers.delete(ms);
        clearTimeout(timer);
      }
    };
  };

  schedulers.set(ms, scheduler);

  return scheduler;
}
