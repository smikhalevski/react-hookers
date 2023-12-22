import { AbortableCallback, AsyncResult } from 'parallel-universe';
import { DependencyList, useEffect } from 'react';
import { EXECUTOR, useExecutor } from './useExecutor';
import { useIsChanged } from './useIsChanged';
import { emptyDeps } from './utils';

/**
 * Manages async callback execution process and provides ways to access execution results.
 *
 * @template T The result stored by the executor.
 */
export interface ExecutionProtocol<T = any> {
  /**
   * `true` if result was fulfilled or rejected, or `false` otherwise.
   */
  readonly isSettled: boolean;

  /**
   * `true` if the result was fulfilled with a value, or `false` otherwise.
   */
  readonly isFulfilled: boolean;

  /**
   * `true` if the result was rejected with a reason, or `false` otherwise.
   */
  readonly isRejected: boolean;

  /**
   * `true` if an execution is currently pending, or `false` otherwise.
   */
  readonly isPending: boolean;

  /**
   * The result value or `undefined` if failed.
   */
  readonly result: T | undefined;

  /**
   * The reason of failure.
   */
  readonly reason: any;

  /**
   * The promise of the execution result, or `null` if execution isn't pending.
   */
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
  const executor = useExecutor<T>(cb);
  const isChanged = useIsChanged([executor[EXECUTOR]]);

  useEffect(() => {
    if (!isChanged) {
      executor.execute(cb);
    }
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
