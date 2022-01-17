import {useRef} from 'react';

/**
 * Compares the state passed during the previous render with the newly given state, and if they differ based on
 * equality checker, then the new state is returned.
 */
export function usePrevState<S>(state: S, equalityChecker: (prevState: S, nextState: S) => boolean): S {
  const stateRef = useRef(state);

  if (!equalityChecker(stateRef.current, state)) {
    stateRef.current = state;
  }
  return stateRef.current;
}
