import {Context, useContext} from 'react';
import {IExecutorProvider} from './createExecutorCache';
import {ExecutorCallback, IExecutor} from './createExecutor';
import {useRerender} from './useRerender';
import {useMemo} from './useMemo';
import {useRenderEffect} from './useRenderEffect';

/**
 * Creates a hook that is bound to the given {@link ExecutorProviderContext}. The hook creates a new executor and
 * subscribes the component to its updates. Pending execution is aborted when hook is unmounted. The provider is
 * suitable for awaiting pending async results during SSR.
 *
 * @see {@link ExecutorProviderContext}
 * @see {@link useExecutor}
 */
export function createExecutorHook(providerContext: Context<IExecutorProvider>): <T>(initialCb?: ExecutorCallback<T> | T) => IExecutor<T> {
  return (initialCb) => {
    const provider = useContext(providerContext);
    const rerender = useRerender();
    const executor = useMemo(() => provider.createExecutor<any>(() => rerender(true)), [provider]);

    useRenderEffect(() => {
      if (typeof initialCb === 'function') {
        executor.execute(initialCb as ExecutorCallback<any>);
      } else if (initialCb !== undefined) {
        executor.resolve(initialCb);
      }
      return () => provider.disposeExecutor(executor);
    }, [executor]);

    return executor;
  };
}
