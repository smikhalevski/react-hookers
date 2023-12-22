import { Executor } from 'parallel-universe';

/**
 * The executor provider that keeps references to all created executors and provides batch operation for them.
 */
export class ExecutorProvider {
  /**
   * Creates the new executor.
   */
  createExecutor(): Executor {
    return new Executor();
  }

  /**
   * Destroys previously created executor.
   */
  destroyExecutor(executor: Executor): void {
    executor.abort();
  }
}
