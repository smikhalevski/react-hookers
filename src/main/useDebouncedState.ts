import { Dispatch, EffectCallback, SetStateAction, useEffect, useState } from 'react';
import { useFunction } from './useFunction';
import { emptyArray } from './utils/lang';

/**
 * The protocol returned by the {@link useDebouncedState} hook.
 *
 * @template T A stateful value.
 * @group Other
 */
export type DebouncedStateProtocol<T> = [value: T, nextValue: T, setValue: Dispatch<SetStateAction<T>>];

/**
 * Returns stateful values and a function to update them. Upon invocation of `setState`, the `nextState` is assigned
 * synchronously, and the component is re-rendered. After the `ms` the `currState` is set to `nextState` and component
 * is re-rendered again.
 *
 * @param ms A delay after which `currState` is synchronized with `nextState`.
 * @param initialValue An initial value or a callback that returns an initial state.
 * @template T A stateful value.
 * @group Other
 */
export function useDebouncedState<T>(ms: number, initialValue: T | (() => T)): DebouncedStateProtocol<T>;

/**
 * Returns stateful values and a function to update them. Upon invocation of `setState`, the `nextState` is assigned
 * synchronously, and the component is re-rendered. After the `ms` the `currState` is set to `nextState` and component
 * is re-rendered again.
 *
 * @param ms A delay after which `currState` is synchronized with `nextState`.
 * @template T A stateful value.
 * @group Other
 */
export function useDebouncedState<T = undefined>(ms: number): DebouncedStateProtocol<T | undefined>;

export function useDebouncedState<T>(ms: number, initialValue?: T | (() => T)) {
  const [value, setValue] = useState(initialValue);
  const [nextValue, setNextValue] = useState(() => value);

  const manager = useFunction(createDebouncedStateManager, setValue, setNextValue);

  manager.ms = ms;

  useEffect(manager.onMounted, emptyArray);

  return [value, nextValue, manager.applyValue];
}

interface DebouncedStateManager<T> {
  ms: number;
  applyValue: Dispatch<SetStateAction<T>>;
  onMounted: EffectCallback;
}

function createDebouncedStateManager<T>(
  setValue: Dispatch<SetStateAction<T>>,
  setNextValue: Dispatch<SetStateAction<T>>
): DebouncedStateManager<T> {
  let isMounted = false;
  let timer: number;

  const applyValue: Dispatch<SetStateAction<T>> = value => {
    if (!isMounted) {
      return;
    }

    setNextValue(nextValue => {
      if (typeof value === 'function') {
        value = (value as Function)(nextValue) as T;
      }

      clearTimeout(timer);

      timer = setTimeout(setValue, manager.ms, typeof value === 'function' ? () => value : value);

      return value;
    });
  };

  const handleMounted: EffectCallback = () => {
    isMounted = true;

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  };

  const manager: DebouncedStateManager<T> = {
    ms: 0,
    applyValue,
    onMounted: handleMounted,
  };

  return manager;
}
