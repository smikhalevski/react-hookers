import { useIntervalCallback } from './useIntervalCallback';
import { useRerender } from './useRerender';

/**
 * Re-renders the component on a periodic interval.
 *
 * @param ms The interval duration in milliseconds.
 * @see {@link useIntervalCallback}
 * @see {@link useRerender}
 */
export function useRerenderInterval(ms: number): void {
  useIntervalCallback(useRerender(), ms);
}
