import {createContext} from 'react';
import {IntervalManager} from './IntervalManager';

export const intervalManager = new IntervalManager();

export const RerenderIntervalContext = createContext(intervalManager);
