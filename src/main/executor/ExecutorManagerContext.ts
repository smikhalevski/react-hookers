import {createContext} from 'react';
import {ExecutorManager} from './ExecutorManager';

/**
 * The context used by {@link useExecution} and {@link useExecutor} to create and dispose executors.
 */
export const ExecutorManagerContext = createContext(new ExecutorManager());

ExecutorManagerContext.displayName = 'ExecutorManagerContext';
