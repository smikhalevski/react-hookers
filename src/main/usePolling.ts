import { Executor, repeat } from 'parallel-universe';
import { DependencyList, useEffect } from 'react';
import { noop } from './utils';

/**
 * Returns an execution that is periodically updated.
 *
 * Polling starts after the component is mounted and is aborted when component is unmounted.
 */
export function usePolling(executor: Executor, ms: number, deps?: DependencyList): void {
  useEffect(
    () => {
      const promise = repeat(() => executor.retry(), ms);
      promise.catch(noop);

      return () => {
        promise.abort();
      };
    },
    deps !== undefined ? deps.concat(executor, ms) : [executor, ms]
  );
}
