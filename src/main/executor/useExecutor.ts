import { createExecutorHook } from './createExecutorHook';
import { ExecutorProviderContext } from './ExecutorProviderContext';

/**
 * Creates a new [`Executor`](https://github.com/smikhalevski/parallel-universe#executor) an re-renders a component when
 * its state is changed.
 *
 * @see {@link ExecutorProviderContext}
 * @see {@link createExecutorHook}
 * @see {@link useExecution}
 */
export const useExecutor = createExecutorHook(ExecutorProviderContext);
