import { Executor } from 'parallel-universe';

/**
 * The provider that creates and destroys executors.
 */
export class ExecutorProvider {
  /**
   * Returns the executor.
   */
  createExecutor(): Executor {
    return new Executor();
  }

  /**
   * Destroys previously created executor.
   *
   * @param executor The executor to destroy.
   */
  destroyExecutor(executor: Executor): void {
    executor.abort();
  }
}
