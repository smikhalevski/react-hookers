import {Context, useContext, useEffect} from 'react';
import {IntervalManager} from './IntervalManager';
import {useRenderedValueRef} from '../ref';

export type IntervalHook = (delay: number, listener: () => void) => void;

/**
 * Creates a hook that is bound to the given {@link IntervalManager} context.
 *
 * @see {@link intervalManager}
 * @see {@link IntervalManager}
 * @see {@link useInterval}
 */
export function createIntervalHook(managerContext: Context<IntervalManager>): IntervalHook {
  return (delay, listener) => {
    const manager = useContext(managerContext);
    const listenerRef = useRenderedValueRef(listener);

    useEffect(() => manager.scheduleInterval(delay, listenerRef.current), [manager]);
  };
}
