import {IExecution} from './Executor';
import {createExecutionHook} from './createExecutionHook';
import {ExecutorManagerContext} from './ExecutorManagerContext';

/**
 * Executes a callback when dependencies are changed and returns an {@link IExecution}.
 *
 * @see {@link Executor}
 * @see {@link ExecutorManagerContext}
 * @see {@link createExecutionHook}
 * @see {@link useExecutor}
 */
export const useExecution = createExecutionHook(ExecutorManagerContext);
