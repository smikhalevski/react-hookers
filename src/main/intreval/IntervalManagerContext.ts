import {createContext} from 'react';
import {IntervalManager} from './IntervalManager';

/**
 * The {@link IntervalManager} instance used by {@link IntervalManagerContext} by default.
 */
export const intervalManager = new IntervalManager();

/**
 * The context used by {@link useInterval}.
 *
 * @see {@link intervalManager}
 */
export const IntervalManagerContext = createContext(intervalManager);

IntervalManagerContext.displayName = 'IntervalManagerContext';
