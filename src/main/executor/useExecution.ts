import {createExecutionHook} from './createExecutionHook';
import {ExecutorProviderContext} from './ExecutorProviderContext';

/**
 * Executes a callback when dependencies are changed and returns an `Executor`.
 *
 * @see {@link ExecutorProviderContext}
 * @see {@link createExecutionHook}
 * @see {@link useExecutor}
 */
export const useExecution = createExecutionHook(ExecutorProviderContext);
