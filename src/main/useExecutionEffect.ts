import { Executor } from 'parallel-universe';
import { DependencyList, useEffect } from 'react';
import { useSemanticMemo } from './useSemanticMemo';

export function useExecutionEffect<T>(executor: Executor<T>, deps: DependencyList | undefined): void {
  const manager = useSemanticMemo(() => [true], [executor]);

  const [isInitialRender] = manager;

  manager[0] = false;

  useEffect(() => {
    if (!isInitialRender) {
      executor.retry();
    }
  }, deps);
}
