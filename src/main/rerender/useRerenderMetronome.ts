import {useMetronome} from '../metronome';
import {useRerender} from './useRerender';
import {useRef} from 'react';
import {useEffectOnce} from '../effect';

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

  useEffectOnce(useRef<() => void>().current ||= () => start(rerender, ms));
}
