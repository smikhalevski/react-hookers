import type { JointExecutorProvider } from './types';
import { Executor } from 'parallel-universe';
import { createContext } from 'react';

/**
 * The context used by {@link useJointExecution} and {@link useJointExecutor} to join and abandon executors.
 */
export const JointExecutorProviderContext = createContext<JointExecutorProvider>({
  joinExecutor(key) {
    return new Executor();
  },
  abandonExecutor(key, executor) {},
});
