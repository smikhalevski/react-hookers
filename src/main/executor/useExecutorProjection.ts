import { AbortableCallback, Executor } from 'parallel-universe';
import { ExecutorOptions, ExecutorProtocol } from './types';
import { useExecutorBinding } from './useExecutorBinding';

export function useExecutorProjection<T>(
  executor: Executor<T>,
  initialValue?: AbortableCallback<T> | PromiseLike<T> | T,
  options?: ExecutorOptions
): ExecutorProtocol<T> {
  const binding = useExecutorBinding(executor, initialValue, options);

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
    clear: binding.clear,
    abort: binding.abort,
    execute: binding.execute,
    resolve: binding.resolve,
    reject: binding.reject,
  };
}
