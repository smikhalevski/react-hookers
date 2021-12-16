import {Context, DependencyList, useEffect} from 'react';
import {ExecutorCallback, IExecution} from './Executor';
import {emptyDeps} from '../utils';
import {createExecutorHook} from './createExecutorHook';
import {ExecutorManager} from './ExecutorManager';

export type ExecutionHook = <T>(cb: ExecutorCallback<T>, deps?: DependencyList) => IExecution<T>;

/**
 * Creates a hook that is bound to the given {@link ExecutorManager} context.
 *
 * The produced hook creates a new execution and subscribes the component to its updates. Pending execution is aborted
 * when hook is unmounted. The provider is suitable for awaiting pending async results during SSR.
 *
 * @see {@link useExecution}
 * @see {@link ExecutorManagerContext}
 */
export function createExecutionHook(managerContext: Context<ExecutorManager>): ExecutionHook {
  const useExecutor = createExecutorHook(managerContext);

  return (cb, deps) => {
    const executor = useExecutor<any>();

    useEffect(() => {
      executor.execute(cb);
    }, deps || emptyDeps);

    return executor;
  };
}
