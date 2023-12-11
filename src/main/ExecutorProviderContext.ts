import { createContext } from 'react';
import { ExecutorProvider } from './ExecutorProvider';

/**
 * The context used by {@link useExecution} and {@link useExecutor} to create and dispose executors.
 */
export const ExecutorProviderContext = createContext(new ExecutorProvider());
