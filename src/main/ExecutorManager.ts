import { Executor } from 'parallel-universe';

export class ExecutorManager {
  /**
   * Shared executors managed by this {@link ExecutorManager}.
   */
  sharedExecutors = new Map<unknown, Executor>();

  /**
   * Non-shared executors managed by this {@link ExecutorManager}.
   */
  executors = new Set<Executor>();

  /**
   * Returns a shared executor by its key.
   */
  getExecutor(key: unknown): Executor | undefined {
    return this.sharedExecutors.get(key);
  }

  /**
   * Returns an existing shared executor or creates a new one.
   */
  getOrCreateExecutor(key: unknown): Executor {
    let executor = this.sharedExecutors.get(key);

    if (executor === undefined) {
      this.sharedExecutors.set(key, (executor = new Executor()));
    }
    return executor;
  }

  /**
   * Creates a new executor.
   */
  createExecutor(): Executor {
    return new Executor();
  }

  /**
   * Aborts the provided executor and if it's a non-shared executor then removes it from the manager.
   */
  disposeExecutor(executor: Executor): void {
    executor.abort();

    this.executors.delete(executor);
  }
}
