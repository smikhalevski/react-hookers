import {createContext} from 'react';
import {createExecutorCache, IExecutorProvider} from './createExecutorCache';
import {IExecutor} from './createExecutor';
import {createExecutorHook} from './createExecutorHook';

export const ExecutorProviderContext = createContext<IExecutorProvider>(createExecutorCache());

/**
 * Creates a new {@link IExecutor}.
 *
 * ```ts
 * const executor = useExecutor();
 *
 * const handleDelete = () => {
 *   executor.execute(async () => {
 *     // Do delete request here fetch(…)
 *   });
 * };
 *
 * <button
 *   onClick={handleDelete}
 *   disabled={executor.pending}
 * >
 *   {'Delete'}
 * </button>
 * ```
 *
 * @see {@link ExecutorProviderContext}
 * @see {@link createExecutorHook}
 */
export const useExecutor = createExecutorHook(ExecutorProviderContext);
