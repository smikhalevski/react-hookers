import { AbortableCallback } from 'parallel-universe';
import { useEffect } from 'react';
import { useSemanticMemo } from '../useSemanticMemo';
import { emptyDeps } from '../utils';
import { ExecutionProtocol, ExecutorOptions } from './types';
import { useExecutorBindings } from './useExecutorBindings';
import { useExecutorManager } from './useExecutorManager';

export function useExecution<T>(
  key: unknown,
  cb: AbortableCallback<T>,
  deps = emptyDeps,
  options?: ExecutorOptions
): ExecutionProtocol<T> {
  const executor = useExecutorManager().getOrCreateExecutor(key);
  const bindings = useExecutorBindings(executor, cb, options);
  const manager = useSemanticMemo(createExecutionManager, [executor]);

  const { isStale } = manager;

  manager.isStale = true;

  useEffect(() => {
    if (isStale) {
      void bindings.execute(cb);
    }
  }, deps);

  return {
    isFulfilled: executor.isFulfilled,
    isRejected: executor.isRejected,
    isSettled: executor.isSettled,
    isPending: executor.isPending,
    value: executor.value,
    reason: executor.reason,
    promise: executor.promise,
    getOrDefault: bindings.getOrDefault,
  };
}

function createExecutionManager() {
  return { isStale: false };
}
