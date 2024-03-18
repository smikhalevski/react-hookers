import { Dispatch, EffectCallback, SetStateAction, useRef, useState } from 'react';
import { useInsertionEffect } from './useInsertionEffect';
import { emptyDeps, isFunction, noop } from './utils';

/**
 * The protocol returned by the {@link useDebouncedState} hook.
 *
 * @template S The type of stateful value.
 */
export type DebouncedStateProtocol<S> = [currState: S, nextState: S, setState: Dispatch<SetStateAction<S>>];

/**
 * Returns stateful values and a function to update them. Upon invocation of `setState`, the `nextState` is assigned
 * synchronously, and the component is re-rendered. After the `ms` the `currState` is set to `nextState` and component
 * is re-rendered again.
 *
 * @param ms The delay after which `currState` is synchronized with `nextState`.
 * @param initialState Thee initial state or a callback that returns an initial state.
 * @template S The type of stateful value.
 */
export function useDebouncedState<S>(ms: number, initialState: S | (() => S)): DebouncedStateProtocol<S>;

/**
 * Returns stateful values and a function to update them. Upon invocation of `setState`, the `nextState` is assigned
 * synchronously, and the component is re-rendered. After the `ms` the `currState` is set to `nextState` and component
 * is re-rendered again.
 *
 * @param ms The delay after which `currState` is synchronized with `nextState`.
 * @template S The type of stateful value.
 */
export function useDebouncedState<S = undefined>(ms: number): DebouncedStateProtocol<S | undefined>;

export function useDebouncedState<S>(ms: number, initialState?: S | (() => S)) {
  const [currState, setCurrState] = useState(initialState);
  const [nextState, setNextState] = useState(() => currState);

  const manager = (useRef<ReturnType<typeof createDebouncedStateManager>>().current ||= createDebouncedStateManager(
    ms,
    setCurrState,
    setNextState
  ));

  useInsertionEffect(manager.effect, emptyDeps);

  return [currState, nextState, manager.setState];
}

function createDebouncedStateManager<S>(
  ms: number,
  setCurrState: Dispatch<SetStateAction<S>>,
  setNextState: Dispatch<SetStateAction<S>>
) {
  let doSetState = setNextState;

  const effect: EffectCallback = () => {
    let timeout: NodeJS.Timeout | number;

    setNextState(nextState => {
      timeout = setTimeout(setCurrState, ms, () => nextState);
      return nextState;
    });

    doSetState = state => {
      setNextState(nextState => {
        if (isFunction(state)) {
          state = state(nextState);
        }
        clearTimeout(timeout);
        timeout = setTimeout(setCurrState, ms, () => state);
        return state;
      });
    };

    return () => {
      doSetState = noop;
      clearTimeout(timeout);
    };
  };

  return {
    effect,
    setState(state: SetStateAction<S>): void {
      doSetState(state);
    },
  };
}
