import {createTimeHook} from './createTimeHook';
import {TimeContext} from './TimeContext';

export const useTime = createTimeHook(TimeContext);
