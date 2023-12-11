import { createContext } from 'react';
import { Time } from './Time';

/**
 * The context used by {@link useTime}.
 */
export const TimeContext = createContext(new Time());
