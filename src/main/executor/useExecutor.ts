import { AbortableCallback } from 'parallel-universe';
import { ExecutorOptions, ExecutorProtocol } from './types';
import { useExecutorProjection } from './useExecutorProjection';
import { useExecutorManager } from './useExecutorManager';

/**
 * Creates a new {@link https://github.com/smikhalevski/parallel-universe#executor Executor} and returns a protocol to
 * interact with it. Re-renders a component when the executor state is changed. Every instance of this hook is bound to
 * a new executor.
 *
 * @param key The key of the executor to join.
 * @param initialValue The initial value, a promise that resolves with the initial value, or a callback that returns an
 * initial value.
 * @param options Executor options.
 * @template T The result stored by the executor.
 * @see {@link ExecutorManagerContext}
 * @see {@link useExecution}
 */
export function useExecutor<T>(
  key: string,
  initialValue?: AbortableCallback<T> | PromiseLike<T> | T,
  options?: ExecutorOptions
): ExecutorProtocol<T> {
  const executor = useExecutorManager().getOrCreate(key);
  const projection = useExecutorProjection(executor, initialValue, options);

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
    clear: projection.clear,
    abort: projection.abort,
    execute: projection.execute,
    resolve: projection.resolve,
    reject: projection.reject,
  };
}
