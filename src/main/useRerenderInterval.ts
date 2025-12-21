import { useIntervalCallback } from './useIntervalCallback.js';
import { useRerender } from './useRerender.js';

/**
 * Forces the component to re-render at a fixed interval.
 *
 * @param ms The interval duration, in milliseconds.
 * @see {@link useIntervalCallback}
 * @see {@link useRerender}
 * @group Other
 */
export function useRerenderInterval(ms: number): void {
  useIntervalCallback(useRerender(), ms);
}
