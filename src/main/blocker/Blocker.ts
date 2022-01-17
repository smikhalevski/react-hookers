/**
 * Provides mechanism for blocking async processes and unblocking them from an external context.
 *
 * @template T The type of value that can be passed to {@link Blocker.unblock} to resolve the `Promise` returned by
 *     {@link Blocker.block}.
 */
export class Blocker<T> {

  private promise?: Promise<T>;
  private resolve?: (result: T) => void;
  private listener;

  /**
   * Creates a new {@link Blocker}.
   *
   * @param listener The callback that is triggered when {@link Blocker} is blocked or unblocked.
   */
  public constructor(listener: () => void) {
    this.listener = listener;
  }

  public get blocked() {
    return this.resolve != null;
  }

  /**
   * Returns promises that is resolved with the result passed to {@link unblock}. If blocker is already blocked then
   * the same promise is returned.
   */
  public block(): Promise<T> {
    if (!this.promise) {
      this.promise = new Promise((resolve) => {
        this.resolve = resolve;
      });
      this.listener();
    }
    return this.promise;
  }

  /**
   * Resolves the promise returned from {@link block}. If the blocker isn't blocked then no-op.
   */
  public unblock(result: T): void {
    if (this.resolve) {
      const resolve = this.resolve;
      this.resolve = undefined;
      resolve(result);
      this.listener();
    }
  }
}
