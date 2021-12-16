import {createIntervalHook} from './createIntervalHook';
import {IntervalManagerContext} from './IntervalManagerContext';

/**
 * Schedules a listener to be invoked after each interval.
 *
 * All listeners that were scheduled with the same delay are invoked synchronously.
 *
 * @param delay The interval duration in milliseconds.
 * @param listener The listener to invoke.
 *
 * @see {@link useRerenderInterval}
 */
export const useInterval = createIntervalHook(IntervalManagerContext);
