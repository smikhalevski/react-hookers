import { EffectCallback, useRef } from 'react';
import { SetTimeout } from './types';
import { emptyDeps, noop } from './utils';
import { useInsertionEffect } from './useInsertionEffect';

/**
 * Returns the protocol that delays invoking a callback until after a timeout.
 *
 * The delayed invocation is automatically cancelled on unmount.
 *
 * The delay should be started/stopped after the component is mounted. Before that, it is a no-op.
 */
export function useDebounce(): [debounce: SetTimeout, cancel: () => void] {
  const manager = (useRef<ReturnType<typeof createDebounceManager>>().current ||= createDebounceManager());

  useInsertionEffect(manager.effect, emptyDeps);

  return [manager.debounce as SetTimeout, manager.cancel];
}

function createDebounceManager() {
  let _debounce: (args: Parameters<SetTimeout>) => void = noop;
  let _cancel = noop;

  const effect: EffectCallback = () => {
    let timeout: NodeJS.Timeout;

    _debounce = args => {
      _cancel();
      timeout = setTimeout(...args);
    };

    _cancel = () => {
      clearTimeout(timeout);
    };

    return () => {
      _cancel();
      _debounce = _cancel = noop;
    };
  };

  return {
    effect,
    debounce(...args: Parameters<SetTimeout>): void {
      _debounce(args);
    },
    cancel(): void {
      _cancel();
    },
  };
}
