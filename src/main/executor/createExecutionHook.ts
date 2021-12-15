import {Context, DependencyList, useEffect} from 'react';
import {IExecutorProvider} from './ExecutorCache';
import {ExecutorCallback, IExecution} from './Executor';
import {emptyDeps} from '../utils';
import {createExecutorHook} from './createExecutorHook';

export type ExecutionHook = <T>(cb: ExecutorCallback<T>, deps?: DependencyList) => IExecution<T>;

/**
 * Creates a hook that is bound to the given {@link IExecutorProvider} context.
 *
 * The produced hook creates a new execution and subscribes the component to its updates. Pending execution is aborted
 * when hook is unmounted. The provider is suitable for awaiting pending async results during SSR.
 *
 * @see {@link useExecution}
 * @see {@link ExecutorProviderContext}
 * @see {@link executorCache}
 */
export function createExecutionHook(providerContext: Context<IExecutorProvider>): ExecutionHook {
  const useExecutor = createExecutorHook(providerContext);

  return (cb, deps) => {
    const executor = useExecutor<any>();

    useEffect(() => {
      executor.execute(cb);
    }, deps || emptyDeps);

    return executor;
  };
}
