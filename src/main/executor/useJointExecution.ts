import type { AbortableCallback } from 'parallel-universe';
import type { ExecutionProtocol } from './types';
import { useContext } from 'react';
import { emptyDeps } from '../utils';
import { JointExecutorProviderContext } from './JointExecutorProviderContext';
import { useDelegatedExecutorProvider } from './useDelegatedExecutorProvider';
import { useExecutionByProvider } from './useExecutionByProvider';

/**
 * Executes a callback when dependencies are changed and returns an execution.
 *
 * @param key The key of the executor to join.
 * @param cb The callback that in invoked during the first render and if dependencies are changed.
 * @param deps The dependencies that cause the callback to be invoked again when changed.
 * @see {@link JointExecutorProviderContext}
 * @see {@link useJointExecutor}
 */
export function useJointExecution<T>(key: string, cb: AbortableCallback<T>, deps = emptyDeps): ExecutionProtocol<T> {
  return useExecutionByProvider(useDelegatedExecutorProvider(useContext(JointExecutorProviderContext), key), cb, deps);
}
