import {TimeContext} from './TimeContext';
import {useContext} from 'react';

export function useTime() {
  return useContext(TimeContext);
}
