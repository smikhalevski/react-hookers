import React from 'react';

const EMPTY_DEPS: React.DependencyList = [];

export type Debounce = <A extends Array<unknown>>(callback: (...args: A) => void, delay?: number, ...args: A) => void;

export function useDebounce(): Readonly<[debounce: Debounce, cancel: () => void]> {
  const manager = React.useRef<ReturnType<typeof createManager>>().current ||= createManager();

  React.useEffect(manager.effect, EMPTY_DEPS);

  return manager.tuple;
}

function createManager() {

  let timeout: number;

  const debounce: Debounce = (...args) => {
    cancel();
    timeout = setTimeout(...args);
  };

  const cancel = () => clearTimeout(timeout);

  const effect = () => cancel;

  return {
    effect,
    tuple: [debounce, cancel] as const,
  };
}
