import {Executor} from 'parallel-universe';
import {disposeExecutor} from './disposeExecutor';

/**
 * The stateless provider that creates and disposes executors.
 */
export class ExecutorProvider {

  /**
   * Creates a new `Executor` instance.
   */
  public createExecutor(): Executor {
    return new Executor();
  }

  /**
   * Disposes an executor.
   */
  public disposeExecutor(executor: Executor): void {
    disposeExecutor(executor);
  }
}
