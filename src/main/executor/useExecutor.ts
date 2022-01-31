import {createExecutorHook} from './createExecutorHook';
import {ExecutorProviderContext} from './ExecutorProviderContext';

/**
 * Creates a new `Executor`.
 *
 * @see {@link ExecutorProviderContext}
 * @see {@link createExecutorHook}
 * @see {@link useExecution}
 */
export const useExecutor = createExecutorHook(ExecutorProviderContext);
