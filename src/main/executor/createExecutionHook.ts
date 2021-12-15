import {Context, DependencyList, useEffect} from 'react';
import {IExecutorProvider} from './ExecutorCache';
import {ExecutorCallback, IExecution} from './Executor';
import {emptyDeps} from '../utils';
import {createExecutorHook} from './createExecutorHook';

export type ExecutionHook = <T>(cb: ExecutorCallback<T>, deps?: DependencyList) => IExecution<T>;

export function createExecutionHook(providerContext: Context<IExecutorProvider>): ExecutionHook {
  const useExecutor = createExecutorHook(providerContext);

  return (cb, deps) => {
    const executor = useExecutor<any>();

    useEffect(() => void executor.execute(cb), deps || emptyDeps);

    return executor;
  };
}
