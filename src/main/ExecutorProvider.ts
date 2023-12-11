import { Executor } from 'parallel-universe';

/**
 * The executor provider that keeps references to all created executors and provides batch operation for them.
 */
export class ExecutorProvider {
  createExecutor(): Executor {
    return new Executor();
  }
}
