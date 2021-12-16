import {Context, useContext} from 'react';
import {Executor, ExecutorCallback} from './Executor';
import {useRerender} from '../rerender';
import {useSemanticMemo} from '../memo';
import {useRenderEffect} from '../effect';
import {isFunction} from '../utils';
import {ExecutorManager} from './ExecutorManager';

export type ExecutorHook = <T>(initialValue?: ExecutorCallback<T> | T) => Executor<T>;

/**
 * Creates a hook that is bound to the given {@link ExecutorManager} context.
 *
 * The produced hook creates a new executor and subscribes the component to its updates. Pending execution is aborted
 * when hook is unmounted. The provider is suitable for awaiting pending async results during SSR.
 *
 * @see {@link useExecutor}
 * @see {@link ExecutorManagerContext}
 */
export function createExecutorHook(managerContext: Context<ExecutorManager>): ExecutorHook {
  return (initialValue) => {

    const manager = useContext(managerContext);
    const rerender = useRerender();
    const executor = useSemanticMemo(() => manager.createExecutor<any>(rerender), [manager]);

    useRenderEffect(() => {
      if (isFunction(initialValue)) {
        executor.execute(initialValue);
      } else if (initialValue !== undefined) {
        executor.resolve(initialValue);
      }
      return () => {
        manager.disposeExecutor(executor);
      };
    }, [executor]);

    return executor;
  };
}
