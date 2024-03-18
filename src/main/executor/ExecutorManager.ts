import { Executor } from 'parallel-universe';

export class ExecutorManager {
  /**
   * Executors managed by this {@link ExecutorManager}.
   */
  executors = new Map<unknown, Executor>();

  /**
   * Returns an existing executor or creates a new one.
   */
  getOrCreate(key: unknown): Executor {
    let executor = this.executors.get(key);

    if (executor === undefined) {
      this.executors.set(key, (executor = new Executor()));
    }
    return executor;
  }

  /**
   * Invalidates the executor associated with the key, or no-op if there's no such executor.
   */
  invalidate(key: unknown): void {
    this.executors.get(key)?.invalidate();
  }
}
