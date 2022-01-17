import {createContext} from 'react';
import {Time} from './Time';

/**
 * The context used by {@link useTime}.
 *
 * @see {@link time}
 */
export const TimeContext = createContext(new Time());

TimeContext.displayName = 'TimeContext';
