import type { AbortableCallback } from 'parallel-universe';
import type { ExecutionProtocol } from './types';
import { useContext } from 'react';
import { emptyDeps } from '../utils';
import { ExecutorProviderContext } from './ExecutorProviderContext';
import { useExecutionByProvider } from './useExecutionByProvider';

/**
 * Executes a callback when dependencies are changed and returns an execution.
 *
 * @param cb The callback that in invoked during the first render and if dependencies are changed.
 * @param deps The dependencies that cause the callback to be invoked again when changed.
 * @see {@link ExecutorProviderContext}
 * @see {@link useExecutor}
 */
export function useExecution<T>(cb: AbortableCallback<T>, deps = emptyDeps): ExecutionProtocol<T> {
  return useExecutionByProvider(useContext(ExecutorProviderContext), cb, deps);
}
