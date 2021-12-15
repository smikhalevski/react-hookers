import {useRef} from 'react';

/**
 * Hook that compares the state passed during the previous render with the newly passed state and if they differ basing
 * on `equalityChecker` then the new state is returned.
 */
export function usePrevState<S>(state: S, equalityChecker: (prevState: S, nextState: S) => boolean): S {
  const stateRef = useRef(state);

  if (!equalityChecker(stateRef.current, state)) {
    stateRef.current = state;
  }
  return stateRef.current;
}
