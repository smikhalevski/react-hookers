import {Context, useContext} from 'react';
import {IExecutorProvider} from './ExecutorCache';
import {Executor, ExecutorCallback} from './Executor';
import {useRerender} from '../useRerender';
import {useSemanticMemo} from '../memo';
import {useRenderEffect} from '../effect';
import {isFunction} from '../utils';

export type ExecutorHook = <T>(initialValue?: ExecutorCallback<T> | T) => Executor<T>;

/**
 * Creates a hook that is bound to the given {@link IExecutorProvider} context. The hook creates a new executor and
 * subscribes the component to its updates. Pending execution is aborted when hook is unmounted. The provider is
 * suitable for awaiting pending async results during SSR.
 *
 * @see ExecutorProviderContext
 * @see useExecutor
 */
export function createExecutorHook(providerContext: Context<IExecutorProvider>): ExecutorHook {
  return (initialValue) => {

    const provider = useContext(providerContext);
    const rerender = useRerender();
    const executor = useSemanticMemo(() => provider.createExecutor<any>(rerender), [provider]);

    useRenderEffect(() => {
      if (isFunction(initialValue)) {
        executor.execute(initialValue);
      } else if (initialValue !== undefined) {
        executor.resolve(initialValue);
      }
      return () => {
        provider.disposeExecutor(executor);
      };
    }, [executor]);

    return executor;
  };
}
