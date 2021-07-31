import {DependencyList, useEffect, useRef} from 'react';

const NO_DEPS: DependencyList = [];

export type Debounce = <A extends Array<unknown>>(cb: (...args: A) => void, delay?: number, ...args: A) => void;

/**
 * The replacement for `setTimeout` that is cancelled when component is unmounted.
 */
export function useDebounce(): Readonly<[debounce: Debounce, cancel: () => void]> {
  const manager = useRef<ReturnType<typeof createDebounceManager>>().current ||= createDebounceManager();

  useEffect(manager.effect, NO_DEPS);

  return manager.result;
}

function createDebounceManager() {

  let timeout: number;

  const debounce: Debounce = (...args) => {
    cancel();
    timeout = setTimeout(...args);
  };

  const cancel = () => clearTimeout(timeout);

  const effect = () => cancel;

  return {
    effect,
    result: [debounce, cancel] as const,
  };
}
