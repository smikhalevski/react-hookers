import { useIntervalCallback } from './useIntervalCallback.js';
import { useRerender } from './useRerender.js';

/**
 * Re-renders the component on a periodic interval.
 *
 * @param ms The interval duration in milliseconds.
 * @see {@link useIntervalCallback}
 * @see {@link useRerender}
 * @group Other
 */
export function useRerenderInterval(ms: number): void {
  useIntervalCallback(useRerender(), ms);
}
