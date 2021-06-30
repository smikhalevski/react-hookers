import {ExecutorCache} from './ExecutorCache';
import React from 'react';
import {Executor} from './Executor';
import {useRerender} from './useRerender';
import {useMemo} from './useMemo';
import {useRenderEffect} from './useRenderEffect';

export const ExecutorCacheContext = React.createContext(new ExecutorCache());

/**
 * Creates and returns a new {@link Executor}.
 *
 * @see ExecutorCacheContext
 * @see createExecutorHook
 */
export const useExecutor = createExecutorHook(ExecutorCacheContext);

/**
 * Hook that creates a new executor and subscribes the component to its changes. If `initialResult` is defined then
 * executor is created in resolved state.
 */
export type UseExecutor = <T>(initialResult?: T) => Executor<T | undefined>;

/**
 * Creates {@link UseExecutor} hook that is bound to the given cache context. This cache is suitable for awaiting
 * pending async results during SSR. Pending execution is aborted when hook is unmounted.
 *
 * @see ExecutorCacheContext
 * @see useExecutor
 */
export function createExecutorHook(cacheContext: React.Context<ExecutorCache>): UseExecutor {
  return (initialResult) => {
    const cache = React.useContext(cacheContext);
    const rerender = useRerender();
    const executor = useMemo(() => cache.createExecutor(), [cache]);

    useRenderEffect(() => {
      if (initialResult !== undefined) {
        executor.resolve(initialResult);
      }
      executor.subscribe(() => rerender(true));

      return () => {
        executor.terminate();
        cache.deleteExecutor(executor);
      };
    }, [executor]);

    return executor;
  };
}
