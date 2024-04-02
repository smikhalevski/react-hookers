import { AbortableCallback, Executor } from 'parallel-universe';
import type { ExecutorOptions } from './types';
import { useExecutorManager } from './useExecutorManager';
import { useExecutorSubscription } from './useExecutorSubscription';

export function useSharedExecutor<T>(
  key: unknown,
  initialValue?: AbortableCallback<T> | PromiseLike<T> | T,
  options?: ExecutorOptions
): Executor<T> {
  const executor = useExecutorManager().getOrCreateExecutor(key);

  useExecutorSubscription(executor, initialValue, options);

  return executor;
}
