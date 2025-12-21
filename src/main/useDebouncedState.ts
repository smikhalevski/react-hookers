import { Dispatch, EffectCallback, SetStateAction, useEffect, useState } from 'react';
import { useFunctionOnce } from './useFunctionOnce.js';
import { emptyArray } from './utils/lang.js';

/**
 * Returns stateful values and a function to update them. Upon invocation of `setState`, the `value` is assigned
 * synchronously, and the component is re-rendered. After the `ms` the `debouncedValue` is set to `value` and
 * component is re-rendered again.
 *
 * @example
 * const [value, debouncedValue, setValue] = useDebouncedState(500, 'hello');
 *
 * useEffect(() => {
 *   fetch('https://example.com/' + debouncedValue);
 * }, [debouncedValue]);
 *
 * <input
 *   type="text"
 *   value={value}
 *   onChange={event => setValue(event.target.value)}
 * />
 *
 * @param ms A delay after which `debouncedValue` is synchronized with `value`.
 * @param initialValue An initial value or a callback that returns an initial state.
 * @template T A stateful value.
 * @group Other
 */
export function useDebouncedState<T>(
  ms: number,
  initialValue: T | (() => T)
): [value: T, debouncedValue: T, setValue: Dispatch<SetStateAction<T>>];

/**
 * Returns stateful values and a function to update them. Upon invocation of `setState`, the `value` is assigned
 * synchronously, and the component is re-rendered. After the `ms` the `debouncedValue` is set to `value` and
 * component is re-rendered again.
 *
 * @example
 * const [value, debouncedValue, setValue] = useDebouncedState(500);
 *
 * useEffect(() => {
 *   fetch('https://example.com/' + debouncedValue);
 * }, [debouncedValue]);
 *
 * <input
 *   type="text"
 *   value={value}
 *   onChange={event => setValue(event.target.value)}
 * />
 *
 * @param ms A delay after which `debouncedValue` is synchronized with `value`.
 * @template T A stateful value.
 * @group Other
 */
export function useDebouncedState<T = undefined>(
  ms: number
): [value: T | undefined, debouncedValue: T | undefined, setValue: Dispatch<SetStateAction<T | undefined>>];

export function useDebouncedState<T>(ms: number, initialValue?: T | (() => T)) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(() => value);

  const manager = useFunctionOnce(createDebouncedStateManager, setValue, setDebouncedValue);

  manager.ms = ms;

  useEffect(manager.onMounted, emptyArray);

  return [value, debouncedValue, manager.applyValue];
}

interface DebouncedStateManager<T> {
  ms: number;
  applyValue: Dispatch<SetStateAction<T>>;
  onMounted: EffectCallback;
}

function createDebouncedStateManager<T>(
  setValue: Dispatch<SetStateAction<T>>,
  setDebouncedValue: Dispatch<SetStateAction<T>>
): DebouncedStateManager<T> {
  let isMounted = false;
  let timer: number;

  const applyValue: Dispatch<SetStateAction<T>> = value => {
    if (!isMounted) {
      return;
    }

    setValue(nextValue => {
      if (typeof value === 'function') {
        value = (value as Function)(nextValue) as T;
      }

      clearTimeout(timer);

      timer = setTimeout(setDebouncedValue, manager.ms, typeof value === 'function' ? () => value : value);

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
