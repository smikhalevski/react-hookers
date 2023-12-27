import type { AbortableCallback } from 'parallel-universe';
import type { ExecutorProtocol } from './types';
import { useContext } from 'react';
import { ExecutorProviderContext } from './ExecutorProviderContext';
import { useExecutorByProvider } from './useExecutorByProvider';

/**
 * Creates a new {@link https://github.com/smikhalevski/parallel-universe#executor Executor} and returns a protocol to
 * interact with it. Re-renders a component when the executor state is changed. Every instance of this hook is bound to
 * a new executor.
 *
 * @param initialValue The initial value, a promise that resolves with the initial value, or a callback that returns an
 * initial value.
 * @template T The result stored by the executor.
 * @see {@link ExecutorProviderContext}
 * @see {@link useExecution}
 */
export function useExecutor<T>(initialValue?: AbortableCallback<T> | PromiseLike<T> | T): ExecutorProtocol<T> {
  return useExecutorByProvider(useContext(ExecutorProviderContext), initialValue);
}
