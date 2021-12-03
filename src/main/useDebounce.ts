import {DependencyList, useEffect, useRef} from 'react';

const NO_DEPS: DependencyList = [];

export type Debounce = <A extends Array<unknown>>(cb: (...args: A) => void, delay?: number, ...args: A) => void;

export type DebounceProtocol = [debounce: Debounce, cancel: () => void];

/**
 * The replacement for `setTimeout` that is cancelled when component is unmounted.
 */
export function useDebounce(): Readonly<DebounceProtocol>  {
  const manager = useRef<ReturnType<typeof createDebounceManager>>().current ||= createDebounceManager();

  useEffect(manager._effect, NO_DEPS);

  return manager._protocol;
}

function createDebounceManager() {

  let timeout: number;

  const debounce: Debounce = (...args) => {
    cancel();
    timeout = setTimeout(...args);
  };

  const cancel = () => clearTimeout(timeout);

  const _effect = () => cancel;

  return {
    _effect,
    _protocol: [debounce, cancel] as const,
  };
}
