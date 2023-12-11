import { createContext } from 'react';
import { ExecutorProvider } from './ExecutorProvider';
import { Executor } from 'parallel-universe';

/**
 * The context used by {@link useExecution} and {@link useExecutor} to create and dispose executors.
 */
export const ExecutorProviderContext = createContext<{ createExecutor(): Executor }>(new ExecutorProvider());
