import type { AbortableCallback } from 'parallel-universe';
import type { ExecutorProtocol } from './types';
import { useContext } from 'react';
import { JointExecutorProviderContext } from './JointExecutorProviderContext';
import { useDelegatedExecutorProvider } from './useDelegatedExecutorProvider';
import { useExecutorByProvider } from './useExecutorByProvider';

/**
 * Joins an {@link https://github.com/smikhalevski/parallel-universe#executor Executor} and returns a protocol to
 * interact with it. Re-renders a component when the executor state is changed. All instances of this hook that use the
 * same key are bound to the same executor.
 *
 * @param key The key of the executor to join.
 * @param initialValue The initial value, a promise that resolves with the initial value, or a callback that returns an
 * initial value. Only applied if the joined executor neither pending nor settled.
 * @template T The result stored by the executor.
 * @see {@link JointExecutorProviderContext}
 * @see {@link useJointExecution}
 */
export function useJointExecutor<T>(
  key: string,
  initialValue?: AbortableCallback<T> | PromiseLike<T> | T
): ExecutorProtocol<T> {
  return useExecutorByProvider(
    useDelegatedExecutorProvider(useContext(JointExecutorProviderContext), key),
    initialValue
  );
}
