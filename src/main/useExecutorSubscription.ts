import { AbortableCallback, Executor } from 'parallel-universe';
import { useEffect } from 'react';
import type { ExecutorOptions } from './types';
import { useRerender } from './useRerender';
import { useSemanticMemo } from './useSemanticMemo';
import { isFunction, noop } from './utils';

export function useExecutorSubscription<T>(
  executor: Executor<T>,
  initialValue: AbortableCallback<T> | PromiseLike<T> | T,
  options: ExecutorOptions | undefined
): void {
  const rerender = useRerender();
  const isServerDisposition = options !== undefined && options.disposition === 'server';

  useSemanticMemo(() => {
    if (isServerDisposition) {
      initExecutor(executor, initialValue);
    }
  }, [executor]);

  useEffect(() => {
    if (!isServerDisposition) {
      initExecutor(executor, initialValue);
    }
    return executor.subscribe(rerender);
  }, [executor]);
}

function initExecutor(executor: Executor, initialValue: any): void {
  if ((executor.isSettled && !executor.isStale) || executor.isPending) {
    return;
  }
  if (isFunction(initialValue)) {
    executor.execute(initialValue).catch(noop);
    return;
  }
  if (initialValue !== undefined) {
    executor.resolve(initialValue);
  }
}
