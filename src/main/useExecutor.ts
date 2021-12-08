import {createContext} from 'react';
import {ExecutorCache, IExecutorProvider} from './ExecutorCache';
import {createExecutorHook} from './createExecutorHook';

export const ExecutorProviderContext = createContext<IExecutorProvider>(new ExecutorCache());

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
 * @see ExecutorProviderContext
 * @see createExecutorHook
 */
export const useExecutor = createExecutorHook(ExecutorProviderContext);
