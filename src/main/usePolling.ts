import { AbortableCallback, repeatUntil } from 'parallel-universe';
import { useExecutor } from './useExecutor';
import { DependencyList, useEffect } from 'react';
import { noop } from './utils';
import { ExecutionProtocol } from './useExecution';

/**
 * Returns an execution that is periodically updated.
 *
 * Polling starts after the component is mounted and is aborted when component is unmounted.
 *
 * @param cb The callback that produces the result.
 * @param ms The delay between the callback invocations.
 * @param deps The optional list of dependencies that trigger the polling restart if changed.
 * @returns The execution that is periodically updated.
 * @template T The result of polling execution.
 */
export function usePolling<T>(cb: AbortableCallback<T>, ms: number, deps?: DependencyList): ExecutionProtocol<T> {
  const executor = useExecutor<T>();

  useEffect(
    () => {
      const abortController = new AbortController();

      repeatUntil(
        () => executor.execute(cb),
        () => abortController.signal.aborted,
        ms
      ).catch(noop);

      return () => {
        abortController.abort();
        executor.abort();
      };
    },
    deps ? deps.concat(executor, ms) : [executor, ms]
  );

  return {
    isFulfilled: executor.isFulfilled,
    isRejected: executor.isRejected,
    isSettled: executor.isSettled,
    isPending: executor.isPending,
    result: executor.result,
    reason: executor.reason,
    promise: executor.promise,
  };
}
