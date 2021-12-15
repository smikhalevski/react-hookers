import {Executor} from './Executor';

export interface IExecutorProvider {

  /**
   * Creates a new {@link Executor} instance.
   */
  createExecutor<T>(listener: () => void): Executor<T>;

  /**
   * Disposes an executor.
   */
  disposeExecutor(executor: Executor): void;
}

/**
 * An executor cache that can be used to monitor and await pending executors.
 */
export class ExecutorCache implements IExecutorProvider {

  public executors: Executor[] = [];

  public createExecutor<T>(listener: () => void): Executor<T> {
    const executor = new Executor<any>(listener);
    this.executors.push(executor);
    return executor;
  }

  public disposeExecutor(executor: Executor): void {
    executor.dispose();
    this.executors.splice(this.executors.indexOf(executor), 1);
  }

  /**
   * Aborts all pending executors.
   */
  public abortAll(): void {
    this.executors.forEach((executor) => {
      executor.abort();
    });
  }

  /**
   * Returns `true` is any of the executors are pending.
   */
  public isPending(): boolean {
    return this.executors.some((executor) => executor.pending);
  }

  /**
   * Creates a new promise that is resolved as soon as all pending executors are resolved. All executions that started
   * after the {@link toPromise} call won't be considered and won't affect the returned promise.
   */
  public toPromise(): Promise<void> {
    return Promise.all(this.executors.map((executor) => executor.promise)).then(() => undefined);
  }
}
