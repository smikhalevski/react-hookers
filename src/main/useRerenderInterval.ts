import { useEffect } from 'react';
import { useRerender } from './useRerender';
import { useInterval } from './useInterval';

/**
 * Re-renders the component on a periodic interval.
 *
 * @param ms The interval duration in milliseconds.
 *
 * @see {@link useInterval}
 * @see {@link useRerender}
 */
export function useRerenderInterval(ms: number): void {
  const [schedule] = useInterval();
  const rerender = useRerender();

  useEffect(() => {
    schedule(rerender, ms);
  }, [ms]);
}
