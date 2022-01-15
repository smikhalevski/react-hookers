export interface Execution<T> {

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

export type ExecutorCallback<T> = (signal: AbortSignal) => Promise<T | undefined> | T | undefined;

export class Executor<T = unknown> implements Execution<T> {

  /**
   * `true` if this executor was disposed and shouldn't be used.
   */
  public disposed = false;
  public pending = false;
  public resolved = false;
  public rejected = false;
  public result: T | undefined;
  public reason: any;
  public promise: Promise<void> | undefined;

  private listener;
  private abortController: AbortController | undefined;

  /**
   * Creates a new {@link Executor}.
   *
   * @param listener The callback that is triggered when the executor state was changed.
   */
  public constructor(listener: () => void) {
    this.listener = listener;
  }

  /**
   * Instantly aborts pending execution (if any), marks executor as pending and invokes the callback.
   *
   * If other execution was started before the promise returned by the callback is fulfilled then the signal is aborted
   * and the returned result is ignored.
   *
   * The returned promise is never rejected.
   */
  public execute(cb: ExecutorCallback<T>): Promise<void> {

    if (this.disposed) {
      return Promise.resolve();
    }

    this.abortController?.abort();
    this.abortController = new AbortController();

    let result;
    try {
      result = cb(this.abortController.signal);
    } catch (error) {
      this.reject(error);
      return Promise.resolve();
    }
    if (!(result instanceof Promise)) {
      this.resolve(result);
      return Promise.resolve();
    }
    if (!this.pending) {
      this.pending = true;
      this.listener();
    }
    const cbPromise = this.promise = Promise.resolve(result).then(
        (result) => {
          if (cbPromise === this.promise) {
            this.resolve(result);
          }
        },
        (reason) => {
          if (cbPromise === this.promise) {
            this.reject(reason);
          }
        },
    );
    return cbPromise;
  }

  /**
   * Instantly aborts pending execution and prevents any further executions.
   */
  public dispose(): this {
    if (!this.disposed) {
      this.disposed = true;
      this._forceAbort();
      this.listener();
    }
    return this;
  }

  /**
   * Clears available results and doesn't affect the pending execution.
   */
  public clear(): this {
    if (!this.disposed && (this.resolved || this.rejected)) {
      this.resolved = this.rejected = false;
      this.result = this.reason = undefined;
      this.listener();
    }
    return this;
  }

  /**
   * Instantly aborts pending execution and preserves available results. Value (or error) returned from pending
   * callback is ignored. The signal passed to the executed callback is aborted.
   */
  public abort(): this {
    if (!this.disposed && this.pending) {
      this._forceAbort();
      this.listener();
    }
    return this;
  }

  /**
   * Instantly aborts pending execution and resolves with the given result.
   */
  public resolve(result: T | undefined): this {
    if (!this.disposed && (this.pending || !Object.is(this.result, result))) {
      this._forceAbort();
      this.resolved = true;
      this.rejected = false;
      this.result = result;
      this.reason = undefined;
      this.listener();
    }
    return this;
  }

  /**
   * Instantly aborts pending execution and rejects with the given reason.
   */
  public reject(reason: any): this {
    if (!this.disposed && (this.pending || !Object.is(this.reason, reason))) {
      this._forceAbort();
      this.resolved = false;
      this.rejected = true;
      this.result = undefined;
      this.reason = reason;
      this.listener();
    }
    return this;
  }

  private _forceAbort() {
    this.pending = false;
    this.abortController?.abort();
    this.promise = this.abortController = undefined;
  }
}
