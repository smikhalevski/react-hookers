import { AbortableCallback } from 'parallel-universe';
import { emptyDeps } from '../utils';
import { ExecutionProtocol, ExecutorOptions } from './types';
import { useExecutionProjection } from './useExecutionProjection';
import { useExecutorManager } from './useExecutorManager';

export function useExecution<T>(
  key: unknown,
  cb: AbortableCallback<T>,
  deps = emptyDeps,
  options?: ExecutorOptions
): ExecutionProtocol<T> {
  return useExecutionProjection(useExecutorManager().getOrCreate(key), cb, deps, options);
}
