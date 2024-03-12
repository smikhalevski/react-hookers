import { AbortableCallback, AbortablePromise, Executor } from 'parallel-universe';

export class ManagedExecutor<T = any> extends Executor<T> {
  private _executee: AbortableCallback<T> | null = null;

  constructor(
    /**
     * The key by which it is referenced by manager.
     */
    readonly key: any
  ) {
    super();
  }

  /**
   * @inheritDoc
   */
  execute(cb: AbortableCallback<T>): AbortablePromise<T> {
    this._executee = cb;
    return super.execute(cb);
  }

  /**
   * If executor isn't clean, then the most recent callback passed to {@link execute} is executed again.
   */
  invalidate(): void {
    if (this._executee !== null) {
      this.execute(this._executee);
    }
  }
}
