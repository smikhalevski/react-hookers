import {createContext} from 'react';
import {ExecutorCache, IExecutorProvider} from './ExecutorCache';

/**
 * The {@link IExecutorProvider} instance used by {@link ExecutorProviderContext} by default.
 */
export const executorCache = new ExecutorCache();

/**
 * The context used by {@link useExecution} and {@link useExecutor} to create and dispose executors.
 *
 * @see {@link executorCache}
 */
export const ExecutorProviderContext = createContext<IExecutorProvider>(executorCache);
