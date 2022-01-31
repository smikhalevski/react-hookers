import {Executor} from 'parallel-universe';

/**
 * The stateless provider that creates and disposes executors.
 */
export class ExecutorProvider {

  /**
   * Creates a new `Executor` instance.
   */
  public createExecutor(): Executor<any> {
    return new Executor();
  }

  /**
   * Disposes an executor.
   */
  public disposeExecutor(executor: Executor): void {
  }
}
