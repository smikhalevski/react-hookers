import {Execution} from './Executor';
import {createExecutionHook} from './createExecutionHook';
import {ExecutorProviderContext} from './ExecutorProviderContext';

/**
 * Executes a callback when dependencies are changed and returns an {@link Execution}.
 *
 * @see {@link Executor}
 * @see {@link ExecutorProviderContext}
 * @see {@link createExecutionHook}
 * @see {@link useExecutor}
 */
export const useExecution = createExecutionHook(ExecutorProviderContext);
