import { AbortableCallback, Executor } from 'parallel-universe';
import { DependencyList } from 'react';
import type { ExecutorOptions } from './types';
import { useExecutionEffect } from './useExecutionEffect';
import { useSharedExecutor } from './useSharedExecutor';

export function useSharedExecution<T>(
  key: unknown,
  cb: AbortableCallback<T>,
  deps?: DependencyList,
  options?: ExecutorOptions
): Executor<T> {
  const executor = useSharedExecutor(key, cb, options);

  useExecutionEffect(executor, cb, deps);

  return executor;
}
