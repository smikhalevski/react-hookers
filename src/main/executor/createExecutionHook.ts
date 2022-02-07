import {Context, DependencyList, useEffect} from 'react';
import {Execution, ExecutorCallback} from 'parallel-universe';
import {emptyDeps} from '../utils';
import {createExecutorHook} from './createExecutorHook';
import {ExecutorProvider} from './ExecutorProvider';

export type ExecutionHook = <T>(cb: ExecutorCallback<T>, deps?: DependencyList) => Execution<T>;

/**
 * Creates a hook that is bound to the given {@link ExecutorProvider} context.
 *
 * The produced hook creates a new execution and subscribes the component to its updates. Pending execution is aborted
 * when hook is unmounted. The provider is suitable for awaiting pending async results during SSR.
 *
 * @see {@link useExecution}
 * @see {@link ExecutorProviderContext}
 */
export function createExecutionHook(providerContext: Context<ExecutorProvider>): ExecutionHook {
  const useExecutor = createExecutorHook(providerContext);

  return (cb, deps) => {
    const executor = useExecutor<any>();

    useEffect(() => {
      executor.execute(cb);
    }, deps || emptyDeps);

    return executor;
  };
}
