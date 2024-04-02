import { useEffect } from 'react';
import { AbortableCallback, Executor } from 'parallel-universe';
import type { ExecutorOptions } from './types';
import { useExecutorManager } from './useExecutorManager';
import { useExecutorSubscription } from './useExecutorSubscription';
import { useSemanticMemo } from './useSemanticMemo';

export function useExecutor<T>(
  initialValue?: AbortableCallback<T> | PromiseLike<T> | T,
  options?: ExecutorOptions
): Executor<T> {
  const manager = useExecutorManager();
  const executor = useSemanticMemo(() => manager.createExecutor(), [manager]);

  useExecutorSubscription(executor, initialValue, options);

  useEffect(
    () => () => {
      manager.disposeExecutor(executor);
    },
    [executor]
  );

  return executor;
}
