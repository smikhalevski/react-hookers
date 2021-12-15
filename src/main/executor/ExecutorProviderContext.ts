import {createContext} from 'react';
import {ExecutorCache, IExecutorProvider} from './ExecutorCache';

/**
 * The context used by {@link useExecution} and {@link useExecutor} to create and dispose executors.
 */
export const ExecutorProviderContext = createContext<IExecutorProvider>(new ExecutorCache());
