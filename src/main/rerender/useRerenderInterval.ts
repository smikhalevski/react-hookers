import {createRerenderIntervalHook} from './createRerenderIntervalHook';
import {RerenderIntervalContext} from './RerenderIntervalContext';

export const useRerenderInterval = createRerenderIntervalHook(RerenderIntervalContext);
