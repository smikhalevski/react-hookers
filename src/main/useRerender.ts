import { useReducer } from 'react';

/**
 * Returns a callback that unconditionally re-renders a component.
 *
 * **Note:** Using this hook makes your code imperative, which is generally considered a bad practice.
 */
export function useRerender(): () => void {
  return useReducer(reduceCount, 0)[1];
}

function reduceCount(count: number): number {
  return count + 1;
}
