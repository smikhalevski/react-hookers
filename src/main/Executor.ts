import {EventBus} from './EventBus';

/**
 * Holds the last result of an optionally async callback invocation and provides subscription to its state changes.
 */
export class Executor<T> {

  public terminated = false;
  public pending = false;
  public resolved = false;
  public rejected = false;
  public result: T | undefined;
  public reason: any;
  public promise: Promise<void> | undefined;

  /**
   * Aborts currently pending execution.
   */
  private abortController: AbortController | undefined;
  private eventBus = new EventBus<this>();

  public static resolve<T>(result: T): Executor<T> {
    return new Executor<T>().resolve(result);
  }

  public static reject<T>(reason: any): Executor<T> {
    return new Executor<T>().reject(reason);
  }

  public execute(cb: (signal: AbortSignal) => Promise<T>): Promise<void>;

  public execute(cb: (signal: AbortSignal) => T): void;

  public execute(cb: (signal: AbortSignal) => Promise<T> | T): Promise<void> | void {
    if (this.terminated) {
      return;
    }

    this.pending = false;
    this.promise = undefined;

    this.abortController?.abort();
    this.abortController = new AbortController();

    let result;
    try {
      result = cb(this.abortController.signal);
    } catch (reason) {
      this.reject(reason);
      return;
    }

    if (result instanceof Promise) {
      this.pending = true;
      this.eventBus.publish(this);

      const promise = this.promise = result.then(
          (result) => {
            if (promise === this.promise) {
              this.resolve(result);
            }
          },
          (reason) => {
            if (promise === this.promise) {
              this.reject(reason);
            }
          },
      );
      return promise;
    }

    this.resolve(result);
    return;
  }

  /**
   * Clears available results and doesn't affect the pending producer.
   */
  public clear(): this {
    if (this.terminated) {
      return this;
    }
    this.resolved = false;
    this.rejected = false;
    this.result = undefined;
    this.reason = undefined;
    this.eventBus.publish(this);
    return this;
  }

  /**
   * Aborts pending execution and preserves available results. Value (or error) returned from pending callback is
   * ignored.
   */
  public abort(): this {
    if (this.terminated) {
      return this;
    }
    this.pending = false;
    this.promise = undefined;
    this.abortController?.abort();
    this.abortController = undefined;
    this.eventBus.publish(this);
    return this;
  }

  /**
   * Aborts pending execution and prevents any further activity.
   */
  public terminate(): this {
    this.abort();
    this.terminated = true;
    return this;
  }

  /**
   * Aborts pending execution and resolves with the given result.
   */
  public resolve(result: T | undefined): this {
    if (this.terminated) {
      return this;
    }
    this.resolved = true;
    this.rejected = false;
    this.result = result;
    this.reason = undefined;
    this.abort();
    return this;
  }

  /**
   * Aborts pending execution and rejects with the given reason.
   */
  public reject(reason: any): this {
    if (this.terminated) {
      return this;
    }
    this.resolved = false;
    this.rejected = true;
    this.result = undefined;
    this.reason = reason;
    this.abort();
    return this;
  }

  /**
   * Subscribes listener to all state changes of this {@link Executor}.
   */
  public subscribe(cb: (executor: this) => void): () => void {
    return this.terminated ? () => undefined : this.eventBus.subscribe(cb);
  }
}
