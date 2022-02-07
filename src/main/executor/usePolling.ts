import {Execution, ExecutorCallback, repeatUntil} from 'parallel-universe';
import {useExecutor} from './useExecutor';
import {DependencyList, useEffect} from 'react';
import {noop, returnFalse} from '../utils';

/**
 * Returns an execution that is periodically updated.
 *
 * @param cb The callback that produces the result.
 * @param ms The delay between the callback invocations.
 * @param deps The optional list of dependencies that trigger the polling restart if changed.
 * @returns The execution that is periodically updated.
 */
export function usePolling<T>(cb: ExecutorCallback<T>, ms: number, deps?: DependencyList): Execution<T> {
  const executor = useExecutor<T>();

  useEffect(() => {
    const ac = new AbortController();

    repeatUntil(() => executor.execute(cb), returnFalse, ms, ac.signal).catch(noop);

    return () => {
      ac.abort();
      executor.abort();
    };
  }, deps ? [executor, ms].concat(deps) : [executor, ms]);

  return executor;
}
