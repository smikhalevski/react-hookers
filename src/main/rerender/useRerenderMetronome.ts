import {useMetronome} from '../metronome';
import {useRerender} from './useRerender';
import {useEffect} from 'react';

/**
 * Re-renders the component on interval.
 *
 * @param ms The interval duration in milliseconds.
 *
 * @see {@link useMetronome}
 * @see {@link useRerender}
 */
export function useRerenderMetronome(ms: number): void {
  const [start] = useMetronome();
  const rerender = useRerender();

  useEffect(() => {
    start(rerender, ms);
  }, [start, ms]);
}
