import {Context, useContext} from 'react';
import {Executor, ExecutorCallback} from 'parallel-universe';
import {useRerender} from '../render';
import {useSemanticMemo} from '../memo';
import {useRenderEffect} from '../effect';
import {isFunction} from '../utils';
import {ExecutorProvider} from './ExecutorProvider';

export type ExecutorHook = <T>(initialValue?: ExecutorCallback<T> | T) => Executor<T>;

/**
 * Creates a hook that is bound to the given {@link ExecutorProvider} context.
 *
 * The produced hook creates a new executor and subscribes the component to its updates. Pending execution is aborted
 * when hook is unmounted. The provider is suitable for awaiting pending async results during SSR.
 *
 * @see {@link useExecutor}
 * @see {@link ExecutorProviderContext}
 */
export function createExecutorHook(providerContext: Context<ExecutorProvider>): ExecutorHook {
  return (initialValue) => {

    const provider = useContext(providerContext);
    const rerender = useRerender();
    const executor = useSemanticMemo(() => provider.createExecutor(), [provider]);

    useRenderEffect(() => {
      if (isFunction(initialValue)) {
        executor.execute(initialValue);
      } else if (initialValue !== undefined) {
        executor.resolve(initialValue);
      }

      const unsubscribe = executor.subscribe(rerender);

      return () => {
        unsubscribe();
        provider.disposeExecutor(executor);
      };
    }, [executor]);

    return executor;
  };
}
