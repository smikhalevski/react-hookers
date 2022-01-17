import {TimeContext} from './TimeContext';
import {useContext, useEffect} from 'react';
import {useRerender} from '../rerender';
import {Time} from './Time';

/**
 * Returns the {@link Time} instance.
 */
export function useTime(): Time {
  const rerender = useRerender();
  const time = useContext(TimeContext);

  useEffect(() => time.subscribe(rerender), [time]);

  return time;
}
