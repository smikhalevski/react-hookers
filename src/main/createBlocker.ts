export interface IBlocker<T> {

  /**
   * Returns `true` if this blocker is blocked.
   */
  readonly blocked: boolean;

  /**
   * Returns promises that is resolved with the result passed to {@link unblock}. If blocker is already blocked then
   * the same promise is returned.
   */
  block(): Promise<T>;

  /**
   * Resolves the promise returned from {@link block}. If the blocker isn't blocked then no-op.
   */
  unblock(result: T): void;
}

/**
 * Creates a new {@link IBlocker}.
 *
 * @param listener The callback that is triggered when {@link IBlocker} is blocked or unblocked.
 */
export function createBlocker<T>(listener: () => void): IBlocker<T> {

  let promise: Promise<T> | undefined;
  let resolve: (result: T) => void;

  const block = () => {
    if (!promise) {
      promise = new Promise((nextResolve) => resolve = nextResolve);
      listener();
    }
    return promise;
  };

  const unblock = (result: T) => {
    if (promise) {
      resolve(result);
      promise = undefined;
      listener();
    }
  };

  return {
    get blocked() {
      return promise != null;
    },

    block,
    unblock,
  };
}
