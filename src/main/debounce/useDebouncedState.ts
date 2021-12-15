import {Dispatch, SetStateAction, useRef} from 'react';
import {useEffectOnce} from '../effect';
import {isFunction} from '../utils';
import {useRerender} from '../useRerender';

export type DebouncedStateProtocol<S> = [currState: S, nextState: S, setState: Dispatch<SetStateAction<S>>];

/**
 * Returns a stateful values, and a function to update it. Upon invocation of `setState`, the `nextState` is assigned
 * synchronously and component is re-rendered. After the `delay` the `currState` is set to `nextState` and component is
 * re-rendered again.
 *
 * @param delay The delay after which `currState` is synchronized with `nextState`.
 * @param initialState Thee initial state or a callback that returns an initial state.
 * @template S The type of stateful value.
 */
export function useDebouncedState<S>(delay: number, initialState: S | (() => S)): Readonly<DebouncedStateProtocol<S>>;

/**
 * Returns a stateful values, and a function to update it. Upon invocation of `setState`, the `nextState` is assigned
 * synchronously and component is re-rendered. After the `delay` the `currState` is set to `nextState` and component is
 * re-rendered again.
 *
 * @param delay The delay after which `currState` is synchronized with `nextState`.
 * @template S The type of stateful value.
 */
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

  const _effect = () => () => clearTimeout(timeout);

  return {
    _effect,
    _protocol: protocol,
  };
}
