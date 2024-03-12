import { AbortableCallback, repeat } from 'parallel-universe';
import { useExecutor } from './useExecutor';
import { DependencyList, useEffect } from 'react';
import { noop } from '../utils';
import { ExecutionProtocol } from './types';

/**
 * Returns an execution that is periodically updated.
 *
 * Polling starts after the component is mounted and is aborted when component is unmounted.
 *
 * @param key The key of the executor to join.
 * @param cb The callback that produces the result.
 * @param ms The delay between the callback invocations.
 * @param deps The optional list of dependencies that trigger the polling restart if changed.
 * @returns The execution that is periodically updated.
 * @template T The result of polling execution.
 */
export function usePollingExecution<T>(
  key: unknown,
  cb: AbortableCallback<T>,
  ms: number,
  deps?: DependencyList
): ExecutionProtocol<T> {
  const executor = useExecutor<T>(key, undefined, { clientOnly: true });

  useEffect(
    () => {
      const promise = repeat(signal => executor.execute(cb).withSignal(signal).catch(noop), ms);
      promise.catch(noop);

      return () => {
        promise.abort();
      };
    },
    deps !== undefined ? deps.concat(executor, ms) : [executor, ms]
  );

  return {
    isFulfilled: executor.isFulfilled,
    isRejected: executor.isRejected,
    isSettled: executor.isSettled,
    isPending: executor.isPending,
    value: executor.value,
    reason: executor.reason,
    promise: executor.promise,
    getOrDefault: defaultValue => executor.getOrDefault(defaultValue),
  };
}
