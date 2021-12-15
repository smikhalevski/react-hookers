import {ExecutorCallback, IExecution} from './Executor';
import {DependencyList, useEffect} from 'react';
import {useExecutor} from './useExecutor';
import {emptyDeps} from './utils';

/**
 * Executes a callback when dependencies are changed and returns an {@link IExecution}.
 */
export function useExecution<T>(cb: ExecutorCallback<T>, deps?: DependencyList): IExecution<T> {
  const executor = useExecutor<T>();

  useEffect(() => void executor.execute(cb), deps || emptyDeps);

  return executor;
}
