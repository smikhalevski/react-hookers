import {Executor} from '../executor';

export type CheckpointCondition = (signal: AbortSignal) => unknown;

export type CheckpointFallback = (replay: () => void) => void;

export class Checkpoint {

  /**
   * Thee executor that invokes the {@link condition}.
   */
  public executor;
  public condition;
  public fallback;

  public constructor(executor: Executor, condition: CheckpointCondition, fallback?: CheckpointFallback) {
    this.executor = executor;
    this.condition = condition;
    this.fallback = fallback;
  }

  /**
   * `true` if a condition is currently being checked.
   */
  public get pending(): boolean {
    return this.executor.pending;
  }

  /**
   * Aborts the pending condition check. If there's no pending condition then no-op.
   */
  public abort(): void {
    this.executor.abort();
  }

  /**
   * Returns a proxy callback that verifies the {@link condition} and executes the `cb` if condition is met or
   * {@link fallback} otherwise.
   *
   * @param cb The callback to guard.
   * @param captureArgs Receives arguments passed to `cb` and returns a persisted version of these arguments. This may
   *     be required if arguments are transient (for example React synthetic events), since the condition check,
   *     fallback and replay invocations are async.
   * @returns The proxy callback with the same signature as `cb`.
   */
  public guard<A extends any[]>(cb: (...args: A) => unknown, captureArgs?: (...args: A) => A | void): (...args: A) => void {
    return (...args) => {
      const capturedArgs = captureArgs?.(...args) || args;

      this.executor.execute((signal) => Promise.resolve(this.condition(signal)).then((ok) => {
        if (signal.aborted) {
          return;
        }
        if (ok) {
          cb(...capturedArgs);
          return;
        }
        this.fallback?.(this.guard(() => {
          cb(...capturedArgs);
        }));
      }));
    };
  }
}
