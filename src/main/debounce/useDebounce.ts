import { EffectCallback, useRef } from 'react';
import { SetTimeout } from '../shared-types';
import { noop } from '../utils';
import { useEffectOnce } from '../effect';

/**
 * Returns the protocol that delays invoking a callback until after a timeout.
 *
 * The delayed invocation is automatically cancelled on unmount.
 *
 * The delay should be started/stopped after the component is mounted. Before that, it is a no-op.
 */
export function useDebounce(): [debounce: SetTimeout, cancel: () => void] {
  const manager = (useRef<ReturnType<typeof createDebounceManager>>().current ||= createDebounceManager());

  useEffectOnce(manager.__effect);

  return [manager.__debounce as SetTimeout, manager.__cancel];
}

function createDebounceManager() {
  let debounce: (args: Parameters<SetTimeout>) => void = noop;
  let cancel = noop;

  const __effect: EffectCallback = () => {
    let timeout: NodeJS.Timeout | number;

    debounce = args => {
      cancel();
      timeout = setTimeout(...args);
    };

    cancel = () => {
      clearTimeout(timeout);
    };

    return () => {
      cancel();
      debounce = cancel = noop;
    };
  };

  return {
    __effect,
    __debounce(...args: Parameters<SetTimeout>) {
      debounce(args);
    },
    __cancel() {
      cancel();
    },
  };
}
