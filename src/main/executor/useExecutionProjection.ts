import { AbortableCallback, Executor } from 'parallel-universe';
import { useEffect } from 'react';
import { useSemanticMemo } from '../useSemanticMemo';
import { emptyDeps } from '../utils';
import { ExecutionProtocol, ExecutorOptions } from './types';
import { useExecutorBinding } from './useExecutorBinding';

export function useExecutionProjection<T>(
  executor: Executor<T>,
  cb: AbortableCallback<T>,
  deps = emptyDeps,
  options?: ExecutorOptions
): ExecutionProtocol<T> {
  const binding = useExecutorBinding(executor, cb, options);
  const manager = useSemanticMemo(createExecutionProjectionManager, [executor]);

  const { isInitialRender } = manager;

  manager.isInitialRender = false;

  useEffect(() => {
    if (!isInitialRender) {
      binding.execute(cb);
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
    getOrDefault: binding.getOrDefault,
  };
}

function createExecutionProjectionManager() {
  return { isInitialRender: true };
}
