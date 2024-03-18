import { AbortableCallback } from 'parallel-universe';
import { useEffect } from 'react';
import { useSemanticMemo } from '../useSemanticMemo';
import { emptyDeps } from '../utils';
import { ExecutionProtocol, ExecutorOptions } from './types';
import { useExecutorManager } from './useExecutorManager';
import { useExecutorProjection } from './useExecutorProjection';

export function useExecution<T>(
  key: string,
  cb: AbortableCallback<T>,
  deps = emptyDeps,
  options?: ExecutorOptions
): ExecutionProtocol<T> {
  const executor = useExecutorManager().getOrCreate(key);
  const projection = useExecutorProjection(executor, cb, options);
  const manager = useSemanticMemo(createExecutionManager, [executor]);

  const { isInitialRender } = manager;

  manager.isInitialRender = false;

  useEffect(() => {
    if (!isInitialRender) {
      projection.execute(cb);
    }
  }, deps);

  return {
    isFulfilled: executor.isFulfilled,
    isRejected: executor.isRejected,
    isSettled: executor.isSettled,
    isPending: executor.isPending,
    isInvalidated: executor.isInvalidated,
    value: executor.value,
    reason: executor.reason,
    promise: executor.promise,
    getOrDefault: projection.getOrDefault,
  };
}

function createExecutionManager() {
  return { isInitialRender: true };
}
