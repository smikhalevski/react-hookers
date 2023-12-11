import { Executor } from 'parallel-universe';
import { noop } from './utils';

/**
 * The executor provider that keeps references to all created executors and provides batch operation for them.
 */
export class SSRExecutorProvider {
  executors: Array<Executor> = [];

  createExecutor(): Executor {
    const executor = new Executor();
    this.executors.push(executor);
    return executor;
  }

  /**
   * Returns `true` is any of the executors are pending.
   */
  hasPendingExecutors(): boolean {
    let pending = false;
    for (const executor of this.executors) {
      pending ||= executor.isPending;
    }
    return pending;
  }

  /**
   * Aborts all pending executors.
   */
  abortExecutors(): void {
    for (const executor of this.executors) {
      executor.abort();
    }
  }

  /**
   * Creates a new promise that is resolved as soon as all pending executors are resolved. All executions that started
   * after the {@link waitForExecutorsToComplete} call won't be considered and won't affect the returned promise.
   */
  waitForExecutorsToComplete(): Promise<void> {
    const promises: Array<Promise<unknown> | null> = [];

    for (const executor of this.executors) {
      promises.push(executor.promise);
    }
    return Promise.all(promises).then(noop);
  }
}
