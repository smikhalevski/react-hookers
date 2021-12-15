import {Context, useContext, useEffect} from 'react';
import {useRerender} from '../rerender';
import {IntervalManager} from './IntervalManager';

export type RerenderIntervalHook = (delay: number) => void;

/**
 * Creates a hook that is bound to the given {@link IntervalManager} context.
 */
export function createRerenderIntervalHook(managerContext: Context<IntervalManager>): RerenderIntervalHook {
  return (delay) => {
    const rerender = useRerender();
    const manager = useContext(managerContext);

    useEffect(() => manager.scheduleInterval(rerender, delay), [manager]);
  };
}
