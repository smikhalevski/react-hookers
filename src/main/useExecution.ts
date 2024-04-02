import { DependencyList, useEffect } from 'react';
import { AbortableCallback, Executor } from 'parallel-universe';
import type { ExecutorOptions } from './types';
import { useExecutionEffect } from './useExecutionEffect';
import { useExecutorManager } from './useExecutorManager';
import { useExecutorSubscription } from './useExecutorSubscription';
import { useSemanticMemo } from './useSemanticMemo';

export function useExecution<T>(
  cb: AbortableCallback<T>,
  deps?: DependencyList,
  options?: ExecutorOptions
): Executor<T> {
  const manager = useExecutorManager();
  const executor = useSemanticMemo(() => manager.createExecutor(), [manager]);

  useExecutorSubscription(executor, cb, options);
  useExecutionEffect(executor, deps);

  useEffect(
    () => () => {
      manager.disposeExecutor(executor);
    },
    [executor]
  );

  return executor;
}
