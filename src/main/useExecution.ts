import { AbortableCallback, AsyncResult } from 'parallel-universe';
import { DependencyList } from 'react';
import { emptyDeps } from './utils';
import { useExecutor } from './useExecutor';
import { useInsertionEffect } from './useInsertionEffect';

export interface ExecutionProtocol<T = any> {
  readonly isFulfilled: boolean;
  readonly isRejected: boolean;
  readonly isSettled: boolean;
  readonly isPending: boolean;
  readonly result: T | undefined;
  readonly reason: any;
  readonly promise: Promise<AsyncResult<T>> | null;
}

/**
 * Executes a callback when dependencies are changed and returns an
 * {@link https://github.com/smikhalevski/parallel-universe#executor Execution}.
 *
 * @see {@link ExecutorProviderContext}
 * @see {@link useExecutor}
 */
export function useExecution<T>(cb: AbortableCallback<T>, deps?: DependencyList): ExecutionProtocol<T> {
  const executor = useExecutor<T>();

  useInsertionEffect(() => {
    executor.execute(cb);
  }, deps || emptyDeps);

  return {
    isFulfilled: executor.isFulfilled,
    isRejected: executor.isRejected,
    isSettled: executor.isSettled,
    isPending: executor.isPending,
    result: executor.result,
    reason: executor.reason,
    promise: executor.promise,
  };
}
