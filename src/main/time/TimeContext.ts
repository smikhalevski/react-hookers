import {createContext} from 'react';
import {Time} from './Time';

/**
 * The {@link Time} instance used by {@link TimeContext} by default.
 */
export const time = new Time();

/**
 * The context used by {@link useTime}.
 *
 * @see {@link time}
 */
export const TimeContext = createContext(time);

TimeContext.displayName = 'TimeContext';
