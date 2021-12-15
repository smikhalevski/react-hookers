import {Dispatch, SetStateAction, useRef} from 'react';
import {useEffectOnce} from './useEffectOnce';
import {isFunction} from './isFunction';
import {useRerender} from './useRerender';

export type DebouncedStateProtocol<S> = [currState: S, nextState: S, setState: Dispatch<SetStateAction<S>>];

export function useDebouncedState<S>(delay: number, initialState: S | (() => S)): Readonly<DebouncedStateProtocol<S>>;

export function useDebouncedState<S = undefined>(delay: number): Readonly<DebouncedStateProtocol<S | undefined>>;

export function useDebouncedState<S>(delay: number, initialState?: S | (() => S)) {
  const rerender = useRerender();
  const manager = useRef<ReturnType<typeof createDebouncedStateManager>>().current ||= createDebouncedStateManager<unknown>(delay, rerender, initialState);

  useEffectOnce(manager._effect);

  return manager._protocol;
}

function createDebouncedStateManager<S>(delay: number, rerender: () => void, initialState: S | (() => S) | undefined) {

  let timeout: ReturnType<typeof setTimeout>;
  let currState = isFunction(initialState) ? initialState() : initialState;
  let nextState = currState;

  const setState: Dispatch<SetStateAction<S | undefined>> = (state) => {
    clearTimeout(timeout);

    if (isFunction(state)) {
      state = state(nextState);
    }
    if (Object.is(nextState, state)) {
      return;
    }
    protocol[1] = nextState = state;
    rerender();

    if (Object.is(currState, nextState)) {
      return;
    }
    timeout = setTimeout(() => {
      protocol[0] = currState = nextState;
      rerender();
    }, delay);
  };

  const protocol: DebouncedStateProtocol<S | undefined> = [currState, nextState, setState];

  const _effect = () => clearTimeout(timeout);

  return {
    _effect,
    _protocol: protocol,
  };
}
