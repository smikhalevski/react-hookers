import { AbortableCallback, Executor } from 'parallel-universe';
import { useEffect } from 'react';
import { useSemanticMemo } from '../useSemanticMemo';
import { ExecutorProtocol } from './types';
import { useExecutorProjection } from './useExecutorProjection';

export function useDetachedExecutor<T>(initialValue?: AbortableCallback<T> | PromiseLike<T> | T): ExecutorProtocol<T> {
  const executor = useSemanticMemo(() => new Executor());
  const protocol = useExecutorProjection(executor, initialValue, { runsOn: 'client' });

  useEffect(() => {
    executor.abort();
  }, []);

  return protocol;
}
