import {IExecution} from './Executor';
import {createExecutionHook} from './createExecutionHook';
import {ExecutorProviderContext} from './ExecutorProviderContext';

/**
 * Executes a callback when dependencies are changed and returns an {@link IExecution}.
 *
 * @see {@link Executor}
 * @see {@link ExecutorProviderContext}
 * @see {@link createExecutionHook}
 * @see {@link useExecutor}
 * @see {@link executorCache}
 */
export const useExecution = createExecutionHook(ExecutorProviderContext);
