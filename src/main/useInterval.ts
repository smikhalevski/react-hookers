import { EffectCallback } from 'react';
import { Schedule } from './types';
import { useInsertionEffect } from './useInsertionEffect';
import { useSemanticMemo } from './useSemanticMemo';
import { emptyDeps, noop } from './utils';

/**
 * The replacement for `window.setInterval` that schedules a function to be repeatedly called with a fixed time delay
 * between each call. Interval is cancelled when component is unmounted or when a new interval is scheduled.
 *
 * All functions that were scheduled with the same delay are invoked synchronously across all components that use this
 * hook.
 *
 * Intervals must be scheduled/canceled after the component is mounted. Before that, it is a no-op.
 *
 * @see {@link useRerenderInterval}
 */
export function useInterval(): [schedule: Schedule, cancel: () => void] {
  const manager = useSemanticMemo(createIntervalManager);

  useInsertionEffect(manager.effect, emptyDeps);

  return [manager.schedule, manager.cancel];
}

function createIntervalManager() {
  let doSchedule: <A extends unknown[]>(cb: (...args: A) => void, ms: number, args: A) => void = noop;
  let doCancel = noop;

  const effect: EffectCallback = () => {
    let abort: (() => void) | undefined;

    doSchedule = (cb, ms, args) => {
      doCancel();

      abort = getGlobalInterval(Math.max(ms | 0, 0))(() => {
        cb(...args);
      });
    };

    doCancel = () => {
      if (abort !== undefined) {
        abort();
        abort = undefined;
      }
    };

    return () => {
      doCancel();
      doSchedule = doCancel = noop;
    };
  };

  const schedule: Schedule = (cb, ms, ...args) => {
    doSchedule(cb, ms, args);
  };

  return {
    effect,
    schedule,
    cancel() {
      doCancel();
    },
  };
}

type Interval = (cb: () => void) => () => void;

const globalIntervals = new Map<number, Interval>();

function getGlobalInterval(ms: number): Interval {
  let interval = globalIntervals.get(ms);

  if (interval !== undefined) {
    return interval;
  }

  const callbacks: Array<() => void> = [];

  let timeout: NodeJS.Timeout | number;

  const tick = () => {
    for (const cb of callbacks) {
      try {
        cb();
      } catch (e) {
        setTimeout(() => {
          throw e;
        });
      }
    }

    timeout = setTimeout(tick, ms);
  };

  interval = cb => {
    if (callbacks.indexOf(cb) === -1 && callbacks.push(cb) === 1) {
      timeout = setTimeout(tick, ms);
    }

    return () => {
      const index = callbacks.indexOf(cb);

      if (index !== -1 && (callbacks.splice(index, 1), callbacks.length === 0)) {
        globalIntervals.delete(ms);
        clearTimeout(timeout);
      }
    };
  };

  globalIntervals.set(ms, interval);

  return interval;
}
