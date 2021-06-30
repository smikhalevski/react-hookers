import React from 'react';
import {useDebounce} from './useDebounce';

export type DebouncedState<T> = [instantState: T, state: T, setState: React.Dispatch<React.SetStateAction<T>>];

export function useDebouncedState<T>(delay: number, initialState: T | (() => T)): Readonly<DebouncedState<T>>;

export function useDebouncedState<T>(delay: number): Readonly<DebouncedState<T | undefined>>;

export function useDebouncedState<T>(delay: number, initialState?: T | (() => T)): Readonly<DebouncedState<T | undefined>> {
  const [instantState, setInstantState] = React.useState(initialState);
  const [state, setState] = React.useState(instantState);
  const [debounce] = useDebounce();

  const tuple = React.useRef<DebouncedState<T | undefined>>().current ||= [
    instantState,
    state,
    (state) => {
      setInstantState(state);
      debounce(setState, delay, state);
    },
  ];

  tuple[0] = instantState;
  tuple[0] = state;

  return tuple;
}
