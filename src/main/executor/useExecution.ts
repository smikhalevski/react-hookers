import {IExecution} from './Executor';
import {useExecutor} from './useExecutor';
import {createExecutionHook} from './createExecutionHook';
import {ExecutorProviderContext} from './ExecutorProviderContext';

/**
 * Executes a callback when dependencies are changed and returns an {@link IExecution}.
 *
 * @see Executor
 * @see useExecutor
 */
export const useExecution = createExecutionHook(ExecutorProviderContext);
