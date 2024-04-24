import { EffectCallback, useEffect, useRef } from 'react';
import { emptyDeps, noop, type Schedule } from './utils';

/**
 * Returns the protocol that delays invoking a callback until after a timeout.
 *
 * The delayed invocation is automatically cancelled on unmount.
 *
 * The timeout should be started/stopped after the component is mounted. Before that, it is a no-op.
 */
export function useTimeout(): [schedule: Schedule, cancel: () => void] {
  const manager = (useRef<ReturnType<typeof createTimeoutManager>>().current ||= createTimeoutManager());

  useEffect(manager.effect, emptyDeps);

  return [manager.schedule as Schedule, manager.cancel];
}

function createTimeoutManager() {
  let doSchedule: (args: Parameters<Schedule>) => void = noop;
  let doCancel = noop;

  const effect: EffectCallback = () => {
    let timeout: NodeJS.Timeout;

    doSchedule = args => {
      doCancel();
      timeout = setTimeout(...args);
    };

    doCancel = () => {
      clearTimeout(timeout);
    };

    return () => {
      doCancel();
      doSchedule = doCancel = noop;
    };
  };

  return {
    effect,
    schedule(...args: Parameters<Schedule>): void {
      doSchedule(args);
    },
    cancel(): void {
      doCancel();
    },
  };
}
