import { useContext } from 'react';
import { ExecutorManager } from './ExecutorManager';
import { ExecutorManagerContext } from './ExecutorManagerContext';

export function useExecutorManager(): ExecutorManager {
  return useContext(ExecutorManagerContext);
}
