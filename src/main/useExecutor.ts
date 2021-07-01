import React from 'react';
import {useRerender} from './useRerender';
import {useMemo} from './useMemo';
import {useRenderEffect} from './useRenderEffect';
import {createExecutorProvider, IExecutorProvider} from './createExecutorProvider';
import {IExecutor} from './createExecutor';

export const ExecutorProviderContext = React.createContext(createExecutorProvider());

/**
 * Creates and returns a new {@link IExecutor}.
 *
 * @see ExecutorProviderContext
 * @see createExecutorHook
 */
export const useExecutor = createExecutorHook(ExecutorProviderContext);

/**
 * Creates a hook that is bound to the given {@link ExecutorProviderContext}. The hook creates a new executor and
 * subscribes the component to its updates. Pending execution is aborted when hook is unmounted. The provider is
 * suitable for awaiting pending async results during SSR.
 *
 * @see ExecutorProviderContext
 * @see useExecutor
 */
export function createExecutorHook(providerContext: React.Context<IExecutorProvider>): <T>(initialResult?: T) => IExecutor<T> {
  return (initialResult) => {
    const provider = React.useContext(providerContext);
    const rerender = useRerender();
    const executor = useMemo(() => provider.createExecutor(rerender, initialResult), [provider]);

    useRenderEffect(() => () => provider.disposeExecutor(executor), [executor]);

    return executor;
  };
}
