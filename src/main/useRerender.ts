import { useReducer } from 'react';

/**
 * Returns a callback that unconditionally forces a component to re-render.
 *
 * **Note:** Using this hook introduces imperative behavior, which is generally discouraged in React and should be used
 * sparingly.
 *
 * @group Other
 */
export function useRerender(): () => void {
  return useReducer(reduceCount, 0)[1];
}

function reduceCount(count: number): number {
  return count + 1;
}
