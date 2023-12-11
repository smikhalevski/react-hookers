import { TimeContext } from './TimeContext';
import { useContext, useEffect } from 'react';
import { Time } from './Time';
import { useRerender } from './useRerender';

/**
 * Returns the callback that returns the current timestamp.
 */
export function useTime(): Time {
  const rerender = useRerender();
  const time = useContext(TimeContext);

  useEffect(() => time.subscribe(rerender), [time]);

  return time;
}
