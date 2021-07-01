import {createExecutor, IExecutor} from './createExecutor';

export interface IExecutorProvider {

  /**
   * Creates a new {@link IExecutor} instance.
   */
  createExecutor<T>(listener: () => void, initialResult?: T): IExecutor<T>;

  /**
   * Disposes an executor.
   */
  disposeExecutor(executor: IExecutor<unknown>): void;

  /**
   * Aborts all pending executors.
   */
  abortAll(): void;

  /**
   * Returns `true` is any of the executors are pending.
   */
  isPending(): boolean;

  /**
   * Creates a new promise that is resolved as soon as all pending executors are resolved. All executions that started
   * after the `toPromise` call won't be considered and won't affect the returned promise.
   */
  toPromise(): Promise<void>;
}

/**
 * Creates an executor cache that can be used during server rendering to await pending requests.
 */
export function createExecutorProvider(): IExecutorProvider {
  const executors: Array<IExecutor<any>> = [];
  return {

    createExecutor(listener, initialResult) {
      const executor = createExecutor<any>(listener, initialResult);
      executors.push(executor);
      return executor;
    },

    disposeExecutor(executor) {
      executor.dispose();
      executors.splice(executors.indexOf(executor), 1);
    },

    abortAll() {
      for (let i = 0; i < executors.length; i++) {
        executors[i].abort();
      }
    },

    isPending() {
      return executors.some((executor) => executor.pending);
    },

    toPromise() {
      return Promise.all(executors.map((executor) => executor.promise)).then(() => undefined);
    },
  };
}
