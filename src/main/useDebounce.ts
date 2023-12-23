import { EffectCallback, useRef } from 'react';
import { Schedule } from './types';
import { emptyDeps, noop } from './utils';
import { useInsertionEffect } from './useInsertionEffect';

/**
 * Returns the protocol that delays invoking a callback until after a timeout.
 *
 * The delayed invocation is automatically cancelled on unmount.
 *
 * The delay should be started/stopped after the component is mounted. Before that, it is a no-op.
 */
export function useDebounce(): [debounce: Schedule, cancel: () => void] {
  const manager = (useRef<ReturnType<typeof createDebounceManager>>().current ||= createDebounceManager());

  useInsertionEffect(manager.effect, emptyDeps);

  return [manager.debounce as Schedule, manager.cancel];
}

function createDebounceManager() {
  let doDebounce: (args: Parameters<Schedule>) => void = noop;
  let doCancel = noop;

  const effect: EffectCallback = () => {
    let timeout: NodeJS.Timeout;

    doDebounce = args => {
      doCancel();
      timeout = setTimeout(...args);
    };

    doCancel = () => {
      clearTimeout(timeout);
    };

    return () => {
      doCancel();
      doDebounce = doCancel = noop;
    };
  };

  return {
    effect,
    debounce(...args: Parameters<Schedule>): void {
      doDebounce(args);
    },
    cancel(): void {
      doCancel();
    },
  };
}
