export interface IExecutor<T> {

  readonly disposed: boolean;
  readonly pending: boolean;
  readonly resolved: boolean;
  readonly rejected: boolean;
  readonly result: T | undefined;
  readonly reason: any;
  readonly promise: Promise<void> | undefined;

  /**
   * Marks executor as pending and invokes a callback. If other execution was started before the result is fulfilled
   * then the provided signal is aborted and the returned result is ignored. Callback is always called asynchronously.
   */
  execute(cb: (signal: AbortSignal) => Promise<T | undefined> | T | undefined): Promise<void>;

  /**
   * Instantly aborts pending execution and prevents any further executions.
   */
  dispose(): void;

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

export function createExecutor<T>(listener: () => void, initialResult?: T): IExecutor<T> {

  let disposed = false;
  let pending = false;
  let resolved = initialResult !== undefined;
  let rejected = false;
  let result = initialResult;
  let reason: any;
  let promise: Promise<void> | undefined;
  let abortController: AbortController | undefined;

  const execute = (cb: (signal: AbortSignal) => Promise<T | undefined> | T | undefined): Promise<void> => {

    if (disposed) {
      return Promise.resolve();
    }

    abortController?.abort();
    abortController = new AbortController();

    if (!pending) {
      pending = true;
      listener();
    }

    const signal = abortController.signal;

    return promise = Promise.resolve().then(() => cb(signal)).then(
        (result) => {
          if (signal === abortController?.signal) {
            resolve(result);
          }
        },
        (reason) => {
          if (signal === abortController?.signal) {
            reject(reason);
          }
        },
    );
  };

  const dispose = () => {
    clear();
    abort();
    disposed = true;
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
      pending = false;
      abortController?.abort();
      abortController = undefined;
      promise = undefined;
      listener();
    }
    return executor;
  };

  const resolve = (value: T | undefined) => {
    if (!disposed && (pending || result !== value)) {
      resolved = true;
      rejected = false;
      result = value;
      reason = undefined;
      return abort();
    }
    return executor;
  };

  const reject = (value: any) => {
    if (!disposed && (pending || reason !== value)) {
      resolved = false;
      rejected = true;
      result = undefined;
      reason = value;
      return abort();
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
