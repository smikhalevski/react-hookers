import type { ExecutionProtocol, ExecutorProvider } from './types';
import { DependencyList, useEffect } from 'react';
import { AbortableCallback } from 'parallel-universe';
import { useChanged } from '../useChanged';
import { useExecutorManager } from './useExecutorManager';

/**
 * @internal
 */
export function useExecutionByProvider<T>(
  provider: ExecutorProvider,
  cb: AbortableCallback<T>,
  deps: DependencyList
): ExecutionProtocol<T> {
  const manager = useExecutorManager(provider, cb);
  const isChanged = useChanged([manager]);
  const executor = manager.executor;

  useEffect(() => {
    if (!isChanged) {
      void manager.execute(cb);
    }
  }, deps);

  return {
    isFulfilled: executor.isFulfilled,
    isRejected: executor.isRejected,
    isSettled: executor.isSettled,
    isPending: executor.isPending,
    result: executor.result,
    reason: executor.reason,
    promise: executor.promise,
    abort: manager.abort,
    clear: manager.clear,
    invalidate: manager.invalidate,
  };
}
