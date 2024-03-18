import { AbortableCallback, Executor } from 'parallel-universe';
import { useEffect } from 'react';
import { useSemanticMemo } from '../useSemanticMemo';
import { emptyDeps } from '../utils';
import { ExecutionProtocol } from './types';
import { useExecutionProjection } from './useExecutionProjection';

export function useDetachedExecution<T>(cb: AbortableCallback<T>, deps = emptyDeps): ExecutionProtocol<T> {
  const executor = useSemanticMemo(() => new Executor());
  const protocol = useExecutionProjection(executor, cb, deps, { runsOn: 'client' });

  useEffect(() => {
    executor.abort();
  }, []);

  return protocol;
}
