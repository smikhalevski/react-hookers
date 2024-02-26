import { AbortableCallback } from 'parallel-universe';
import { ExecutorOptions, ExecutorProtocol } from './types';
import { useExecutorBindings } from './useExecutorBindings';
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
  key: unknown,
  initialValue?: AbortableCallback<T> | PromiseLike<T> | T,
  options?: ExecutorOptions
): ExecutorProtocol<T> {
  const executor = useExecutorManager().getOrCreateExecutor(key);
  const bindings = useExecutorBindings(executor, initialValue, options);

  return {
    isFulfilled: executor.isFulfilled,
    isRejected: executor.isRejected,
    isSettled: executor.isSettled,
    isPending: executor.isPending,
    value: executor.value,
    reason: executor.reason,
    promise: executor.promise,
    getOrDefault: bindings.getOrDefault,
    clear: bindings.clear,
    abort: bindings.abort,
    execute: bindings.execute,
    resolve: bindings.resolve,
    reject: bindings.reject,
  };
}
