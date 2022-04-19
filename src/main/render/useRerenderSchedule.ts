import {useRerender} from './useRerender';
import {useEffect} from 'react';
import {useMetronome} from '../metronome';

/**
 * Re-renders the component on a periodic interval.
 *
 * @param ms The interval duration in milliseconds.
 *
 * @see {@link useSchedule}
 * @see {@link useRerender}
 */
export function useRerenderSchedule(ms: number): void {
  const metronome = useMetronome(ms);
  const rerender = useRerender();

  useEffect(() => metronome.schedule(rerender), [metronome]);
}
