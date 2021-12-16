import {TimeContext} from './TimeContext';
import {useContext, useEffect} from 'react';
import {useRerender} from '../rerender';

export function useTime() {
  const rerender = useRerender();
  const time = useContext(TimeContext);

  useEffect(() => time.subscribe(rerender), [time]);

  return time;
}
