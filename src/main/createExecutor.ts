export interface IExecution<T> {

  /**
   * `true` if an execution is currently pending.
   */
  pending: boolean;

  /**
   * `true` if the last execution was resolved.
   */
  resolved: boolean;

  /**
   * `true` if the last execution was rejected.
   */
  rejected: boolean;

  /**
   * The result of the last execution or `undefined` if there was no execution yet or if the last execution was
   * rejected.
   */
  result: T | undefined;

  /**
   * The reason why the last execution was rejected.
   */
  reason: any;

  /**
   * The promise of the currently pending execution or `undefined` if there's no pending execution.
   */
  promise: Promise<void> | undefined;
}

export interface IExecutor<T> extends Readonly<IExecution<T>> {

  /**
   * `true` if this executor was disposed and shouldn't be used.
   */
  readonly disposed: boolean;

  /**
   * Instantly aborts pending execution (if any), marks executor as pending and invokes the callback.
   *
   * If other execution was started before the promise returned by the callback is fulfilled then the signal is aborted
   * and the returned result is ignored.
   *
   * The returned promise is never rejected.
   */
  execute(cb: ExecutorCallback<T>): Promise<void>;

  /**
   * Instantly aborts pending execution and prevents any further executions.
   */
  dispose(): this;

  /**
   * Clears available results and doesn't affect the pending execution.
   */
  clear(): this;

  /**
   * Instantly aborts pending execution and preserves available results. Value (or error) returned from pending
   * callback is ignored. The signal passed to the executed callback is aborted.
   */
  abort(): this;

  /**
   * Instantly aborts pending execution and resolves with the given result.
   */
  resolve(result: T | undefined): this;

  /**
   * Instantly aborts pending execution and rejects with the given reason.
   */
  reject(reason: any): this;
}

export type ExecutorCallback<T> = (signal: AbortSignal) => Promise<T | undefined> | T | undefined;

/**
 * Creates a new {@link IExecutor}.
 *
 * @param listener The callback that is triggered when the executor state was changed.
 */
export function createExecutor<T>(listener: () => void): IExecutor<T> {

  let disposed = false;
  let pending = false;
  let resolved = false;
  let rejected = false;
  let result: T | undefined;
  let reason: any;
  let promise: Promise<void> | undefined;
  let abortController: AbortController | undefined;

  const execute = (cb: ExecutorCallback<T>): Promise<void> => {

    if (disposed) {
      return Promise.resolve();
    }

    abortController?.abort();
    abortController = new AbortController();

    let result;
    try {
      result = cb(abortController.signal);
    } catch (error) {
      reject(error);
      return Promise.resolve();
    }
    if (!(result instanceof Promise)) {
      resolve(result);
      return Promise.resolve();
    }
    if (!pending) {
      pending = true;
      listener();
    }
    const cbPromise = promise = Promise.resolve(result).then(
        (result) => {
          if (cbPromise === promise) {
            resolve(result);
          }
        },
        (reason) => {
          if (cbPromise === promise) {
            reject(reason);
          }
        },
    );
    return cbPromise;
  };

  const forceAbort = () => {
    pending = false;
    abortController?.abort();
    promise = abortController = undefined;
  };

  const dispose = () => {
    if (!disposed) {
      disposed = true;
      forceAbort();
      listener();
    }
    return executor;
  };

  const clear = () => {
    if (!disposed && (resolved || rejected)) {
      resolved = rejected = false;
      result = reason = undefined;
      listener();
    }
    return executor;
  };

  const abort = () => {
    if (!disposed && pending) {
      forceAbort();
      listener();
    }
    return executor;
  };

  const resolve = (value: T | undefined) => {
    if (!disposed && (pending || !Object.is(result, value))) {
      forceAbort();
      resolved = true;
      rejected = false;
      result = value;
      reason = undefined;
      listener();
    }
    return executor;
  };

  const reject = (value: any) => {
    if (!disposed && (pending || !Object.is(reason, value))) {
      forceAbort();
      resolved = false;
      rejected = true;
      result = undefined;
      reason = value;
      listener();
    }
    return executor;
  };

  const executor: IExecutor<T> = {
    get disposed() {
      return disposed;
    },
    get pending() {
      return pending;
    },
    get resolved() {
      return resolved;
    },
    get rejected() {
      return rejected;
    },
    get result() {
      return result;
    },
    get reason() {
      return reason;
    },
    get promise() {
      return promise;
    },

    execute,
    dispose,
    clear,
    abort,
    resolve,
    reject,
  };

  return executor;
}
