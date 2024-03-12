import { ManagedExecutor } from './ManagedExecutor';

export class ExecutorManager {
  private _executors = new Map<unknown, ManagedExecutor>();

  /**
   * Returns an executor by its key.
   */
  get(key: unknown): ManagedExecutor | undefined {
    return this._executors.get(key);
  }

  /**
   * Returns the list of all executors.
   */
  getAll(): ManagedExecutor[] {
    return Array.from(this._executors.values());
  }

  /**
   * Returns an existing executor or creates a new one.
   */
  getOrCreateExecutor(key: unknown): ManagedExecutor {
    let executor = this._executors.get(key);

    if (executor === undefined) {
      executor = new ManagedExecutor(key);
      this._executors.set(key, executor);
    }
    return executor;
  }

  /**
   * If an executor with the given key is managed then it is aborted, cleared, and deleted it from the manager.
   *
   * @returns `true` if the executor was deleted, or `false` otherwise.
   */
  dispose(key: unknown): boolean {
    const executor = this._executors.get(key);

    if (executor !== undefined) {
      executor.abort().clear();
      this._executors.delete(key);
      return true;
    }
    return false;
  }
}
