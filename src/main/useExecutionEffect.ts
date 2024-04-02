import { AbortableCallback, Executor } from 'parallel-universe';
import { DependencyList, useEffect } from 'react';
import { useSemanticMemo } from './useSemanticMemo';
import { noop } from './utils';

export function useExecutionEffect<T>(
  executor: Executor<T>,
  cb: AbortableCallback<T>,
  deps: DependencyList | undefined
): void {
  const manager = useSemanticMemo(() => [true], [executor]);

  const [isInitialRender] = manager;

  manager[0] = false;

  useEffect(() => {
    if (!isInitialRender) {
      executor.execute(cb).catch(noop);
    }
  }, deps);
}
