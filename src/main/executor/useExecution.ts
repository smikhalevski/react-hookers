import { createExecutionHook } from './createExecutionHook';
import { ExecutorProviderContext } from './ExecutorProviderContext';

/**
 * Executes a callback when dependencies are changed and returns an
 * [`Execution`](https://github.com/smikhalevski/parallel-universe#executor).
 *
 * @see {@link ExecutorProviderContext}
 * @see {@link createExecutionHook}
 * @see {@link useExecutor}
 */
export const useExecution = createExecutionHook(ExecutorProviderContext);
