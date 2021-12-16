import {useInterval} from '../intreval';
import {useRerender} from './useRerender';

/**
 * Re-renders the component on interval.
 *
 * @param delay The interval duration in milliseconds.
 *
 * @see {@link useInterval}
 * @see {@link useRerender}
 */
export function useRerenderInterval(delay: number): void {
  useInterval(delay, useRerender());
}
