import { createContext } from 'react';
import { Executor } from 'parallel-universe';
import type { ExecutorProvider } from './types';

/**
 * The context used by {@link useExecution} and {@link useExecutor} to create and dispose executors.
 */
export const ExecutorProviderContext = createContext<ExecutorProvider>({
  createExecutor() {
    return new Executor();
  },
  destroyExecutor(executor) {
    executor.abort();
  },
});
