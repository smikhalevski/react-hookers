import type { AbortableCallback, AsyncResult, Executor } from 'parallel-universe';

/**
 * The provider that creates and destroys executors.
 */
export interface ExecutorProvider {
  /**
   * Returns the executor.
   */
  createExecutor(): Executor;

  /**
   * Destroys the previously created executor.
   *
   * @param executor The executor to destroy.
   */
  destroyExecutor(executor: Executor): void;
}

/**
 * The provider that creates and destroys executors.
 */
export interface JointExecutorProvider {
  /**
   * Retrieves an executor by its key.
   */
  joinExecutor(key: string): Executor;

  /**
   * Abandons an executor when a hook doesn't need it anymore.
   *
   * @param key The key of the executor.
   * @param executor The executor to destroy.
   */
  abandonExecutor(key: string, executor: Executor): void;
}

/**
 * Manages async callback execution process and provides ways to access execution results, abort or replace an
 * execution.
 *
 * @template T The result stored by the executor.
 */
export interface ExecutorProtocol<T = any> {
  /**
   * `true` if result was fulfilled or rejected, or `false` otherwise.
   */
  isSettled: boolean;

  /**
   * `true` if the result was fulfilled with a value, or `false` otherwise.
   */
  isFulfilled: boolean;

  /**
   * `true` if the result was rejected with a reason, or `false` otherwise.
   */
  isRejected: boolean;

  /**
   * `true` if an execution is currently pending, or `false` otherwise.
   */
  isPending: boolean;

  /**
   * The result value or `undefined` if failed.
   */
  result: T | undefined;

  /**
   * The reason of failure.
   */
  reason: any;

  /**
   * The promise of the pending execution result, or `null` if execution isn't pending.
   */
  promise: Promise<AsyncResult<T>> | null;

  /**
   * Returns a {@link result}, or the default value if the result isn't available.
   *
   * @param defaultValue The default value.
   */
  getOrDefault(defaultValue: T): T;

  /**
   * Instantly aborts pending execution (if any), marks executor as pending and invokes the callback.
   *
   * If other execution was started before the promise returned by the callback is fulfilled then the signal is aborted
   * and the returned result is ignored.
   *
   * @param cb The callback that returns the new result for the executor to store.
   * @returns The promise that is resolved with the result of the callback execution.
   */
  execute(cb: AbortableCallback<T>): Promise<AsyncResult<T>>;

  /**
   * Clears available results and doesn't affect the pending execution.
   */
  clear(): void;

  /**
   * Instantly aborts pending execution and preserves available results. Value (or error) returned from pending
   * callback is ignored. The signal passed to the executed callback is aborted.
   */
  abort(): void;

  /**
   * Aborts pending execution and fulfills it with the given result.
   *
   * @param result The result that should be stored in an executor.
   */
  resolve(result: PromiseLike<T> | T): void;

  /**
   * Instantly aborts pending execution and rejects with the given reason.
   *
   * @param reason The reason of failure that should be stored in an executor.
   */
  reject(reason: unknown): void;
}

/**
 * Manages async callback execution process and provides ways to access execution results.
 *
 * @template T The result stored by the executor.
 */
export interface ExecutionProtocol<T = any> {
  /**
   * `true` if result was fulfilled or rejected, or `false` otherwise.
   */
  isSettled: boolean;

  /**
   * `true` if the result was fulfilled with a value, or `false` otherwise.
   */
  isFulfilled: boolean;

  /**
   * `true` if the result was rejected with a reason, or `false` otherwise.
   */
  isRejected: boolean;

  /**
   * `true` if an execution is currently pending, or `false` otherwise.
   */
  isPending: boolean;

  /**
   * The result value or `undefined` if failed.
   */
  result: T | undefined;

  /**
   * The reason of failure.
   */
  reason: any;

  /**
   * The promise of the pending execution result, or `null` if execution isn't pending.
   */
  promise: Promise<AsyncResult<T>> | null;

  /**
   * Clears available results and doesn't affect the pending execution.
   */
  clear(): void;

  /**
   * Instantly aborts pending execution and preserves available results. Value (or error) returned from pending
   * callback is ignored. The signal passed to the executed callback is aborted.
   */
  abort(): void;

  /**
   * Restarts the execution. If the execution is currently pending, it is aborted and then restarted.
   */
  invalidate(): void;
}
