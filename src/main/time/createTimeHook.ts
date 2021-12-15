import {Time} from './Time';
import {Context, useContext, useEffect} from 'react';
import {useRerender} from '../useRerender';

export type TimeHook = (delay?: number) => Time;

export function createTimeHook(timeContext: Context<Time>): TimeHook {
  return (delay) => {
    const rerender = useRerender();
    const time = useContext(timeContext);

    useEffect(() => {
      if (delay != null) {
        return time.subscribe(delay, rerender);
      }
    });

    return time;
  };
}
