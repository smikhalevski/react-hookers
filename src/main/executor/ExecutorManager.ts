import { Executor } from 'parallel-universe';

export class ExecutorManager {
  /**
   * Executors managed by this {@link ExecutorManager}.
   */
  private _executors = new Map<string, Executor>();

  /**
   * Returns an existing executor by its key.
   */
  get(key: string): Executor | undefined {
    return this._executors.get(key);
  }

  /**
   * Returns an existing executor or creates a new one.
   */
  getOrCreate(key: string): Executor {
    let executor = this._executors.get(key);
    return executor !== undefined ? executor : (this._executors.set(key, (executor = new Executor())), executor);
  }

  /**
   * If an executor with the given key is managed then it is aborted, cleared, and deleted it from the manager.
   *
   * @returns `true` if the executor was deleted, or `false` otherwise.
   */
  destroy(key: string): boolean {
    this._executors.get(key)?.abort().clear();
    return this._executors.delete(key);
  }

  /**
   * Invalidates the executor associated with the key, or no-op if there's no such executor.
   */
  invalidate(key: string): void {
    this._executors.get(key)?.invalidate();
  }
}
