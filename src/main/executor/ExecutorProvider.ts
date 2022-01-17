import {Executor} from './Executor';

/**
 * The stateless provider that creates and disposes executors.
 */
export class ExecutorProvider {

  /**
   * Creates a new {@link Executor} instance.
   */
  public createExecutor<T>(listener: () => void): Executor<T> {
    return new Executor<T>(listener);
  }

  /**
   * Disposes an executor.
   */
  public disposeExecutor(executor: Executor): void {
    executor.dispose();
  }
}
