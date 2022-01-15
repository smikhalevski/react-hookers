import {createExecutorHook} from './createExecutorHook';
import {ExecutorProviderContext} from './ExecutorProviderContext';

/**
 * Creates a new {@link Executor}.
 *
 * ```tsx
 * const DeleteButton: FC = () => {
 *
 *   const executor = useExecutor();
 *
 *   const handleDelete = () => {
 *     executor.execute(async () => {
 *       // Do delete request here
 *       // fetch(…)
 *     });
 *   };
 *
 *   return (
 *       <button
 *           onClick={handleDelete}
 *           disabled={executor.pending}
 *       >
 *         {'Delete'}
 *       </button>
 *   );
 * };
 * ```
 *
 * @see {@link Executor}
 * @see {@link ExecutorProviderContext}
 * @see {@link createExecutorHook}
 * @see {@link useExecution}
 */
export const useExecutor = createExecutorHook(ExecutorProviderContext);
