import {Executor} from './Executor';

/**
 * Creates an executor cache that can be used during server rendering to await pending requests.
 *
 * @see ExecutorCacheContext
 */
export class ExecutorCache {

  public executors: Array<Executor<any>> = [];

  /**
   * Creates a new {@link Executor} and adds it to the cache.
   */
  createExecutor<T = any>(): Executor<T> {
    const executor = new Executor<any>();
    this.executors.push(executor);
    return executor;
  }

  /**
   * Destroys an executor and removes it from cache.
   */
  deleteExecutor(executor: Executor<unknown>): void {
    this.executors.splice(this.executors.indexOf(executor), 1);
  }

  /**
   * Returns `true` is any of the executors are pending.
   */
  isPending(): boolean {
    return this.executors.some((executor) => executor.pending);
  }

  /**
   * Creates a new promise that is resolved as soon as all pending executors are resolved. All executions that started
   * after the `toPromise` call won't be considered and won't affect the returned promise.
   */
  toPromise(): Promise<void> {
    return Promise.all(this.executors.map((executor) => executor.promise)).then(() => undefined);
  }
}
