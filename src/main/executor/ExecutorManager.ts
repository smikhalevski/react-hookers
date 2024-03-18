import { Executor } from 'parallel-universe';

export class ExecutorManager {
  /**
   * Executors managed by this {@link ExecutorManager}.
   */
  private _executors = new Map<string, Executor>();

  /**
   * Returns an existing executor or creates a new one.
   */
  getOrCreate(key: string): Executor {
    let executor = this._executors.get(key);

    if (executor === undefined) {
      this._executors.set(key, (executor = new Executor()));
    }
    return executor;
  }

  /**
   * Invalidates the executor associated with the key, or no-op if there's no such executor.
   */
  invalidate(key: string): void {
    this._executors.get(key)?.invalidate();
  }
}
