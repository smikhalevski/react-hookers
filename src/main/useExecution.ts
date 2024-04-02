import { AbortableCallback, Executor } from 'parallel-universe';
import { DependencyList } from 'react';
import type { ExecutorOptions } from './types';
import { useExecutionEffect } from './useExecutionEffect';
import { useExecutor } from './useExecutor';

export function useExecution<T>(
  cb: AbortableCallback<T>,
  deps?: DependencyList,
  options?: ExecutorOptions
): Executor<T> {
  const executor = useExecutor(cb, options);

  useExecutionEffect(executor, cb, deps);

  return executor;
}
