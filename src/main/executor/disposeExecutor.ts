import { Executor } from 'parallel-universe';

/**
 * Aborts an executor and prevents it further usage.
 */
export function disposeExecutor(executor: Executor): void {
  executor.abort();

  executor.execute = function () {
    this.resolve(undefined);
    return Promise.resolve();
  };

  executor.reject =
    executor.resolve =
    executor.clear =
      function () {
        if (process.env.NODE_ENV !== 'production') {
          console.error(
            "Can't perform an update on a disposed executor." +
              ' This is a no-op, but it indicates a memory leak in your application.'
          );
        }
        return this;
      };
}
