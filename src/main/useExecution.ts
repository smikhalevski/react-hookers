import {ExecutorCallback, IExecution} from './createExecutor';
import React from 'react';
import {useExecutor} from './useExecutor';

const NO_DEPS: React.DependencyList = [];

/**
 * Executes a callback when dependencies are changed and returns an {@link IExecution}.
 *
 * ```tsx
 * const [deps, setDeps] = useState();
 *
 * const executor = useExecution(async () => {
 *   // Do some request here fetch(…)
 * }, [deps]);
 *
 * const handleSubmit = () => {
 *   // Change deps
 *   // ...
 *   setDeps(changedDeps);
 * };
 *
 * <button
 *   onClick={handleSubmit}
 *   disabled={executor.pending}
 * >
 *   {'Submit'}
 * </button>
 * ```
 */
export function useExecution<T>(cb: ExecutorCallback<T>, deps?: React.DependencyList): IExecution<T> {
  const executor = useExecutor<T>();

  React.useEffect(() => {
    executor.execute(cb);
  }, deps || NO_DEPS);

  return executor;
}
