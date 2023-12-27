import type { AbortableCallback } from 'parallel-universe';
import type { ExecutorProtocol, ExecutorProvider } from './types';
import { useExecutorManager } from './useExecutorManager';

/**
 * Creates a new {@link https://github.com/smikhalevski/parallel-universe#executor Executor} and returns a protocol to
 * interact with it. Re-renders a component when the executor state is changed. Every instance of this hook is bound to
 * a new executor.
 *
 * @param provider The provider that creates and destroys the executor.
 * @param initialValue The initial value, a promise that resolves with the initial value, or a callback that returns an
 * initial value.
 * @template T The result stored by the executor.
 * @see {@link ExecutorProviderContext}
 * @see {@link useExecution}
 */
export function useExecutorByProvider<T>(
  provider: ExecutorProvider,
  initialValue: AbortableCallback<T> | PromiseLike<T> | T | undefined
): ExecutorProtocol<T> {
  const manager = useExecutorManager(provider, initialValue);
  const { executor } = manager;

  return {
    isFulfilled: executor.isFulfilled,
    isRejected: executor.isRejected,
    isSettled: executor.isSettled,
    isPending: executor.isPending,
    result: executor.result,
    reason: executor.reason,
    promise: executor.promise,
    getOrDefault: manager.getOrDefault,
    execute: manager.execute,
    clear: manager.clear,
    abort: manager.abort,
    resolve: manager.resolve,
    reject: manager.reject,
  };
}
