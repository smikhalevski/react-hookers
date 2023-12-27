import { useSemanticMemo } from '../useSemanticMemo';
import type { ExecutorProvider, JointExecutorProvider } from './types';

export function useDelegatedExecutorProvider(provider: JointExecutorProvider, key: string): ExecutorProvider {
  return useSemanticMemo(() => {
    return {
      createExecutor() {
        return provider.joinExecutor(key);
      },
      destroyExecutor(executor) {
        provider.abandonExecutor(key, executor);
      },
    };
  }, [provider, key]);
}
