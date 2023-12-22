import { Executor } from 'parallel-universe';
import { type ExecutorProvider } from './ExecutorProvider';
import { noop } from './utils';

/**
 * The executor provider that keeps references to all created executors and provides batch operation for them.
 */
export class SSRExecutorProvider implements ExecutorProvider {
  /**
   * The array of all created executors.
   */
  executors: Array<Executor> = [];

  createExecutor(): Executor {
    const executor = new Executor();
    this.executors.push(executor);
    return executor;
  }

  destroyExecutor(executor: Executor): void {
    if (this.executors.splice(this.executors.indexOf(executor), 1).length === 1) {
      executor.abort();
    }
  }

  /**
   * Returns `true` if any of created and not-disposed executors are still pending, or `false` otherwise.
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
   * after the {@link waitForExecutorsToSettle} call aren't be considered and don't affect the returned promise.
   */
  waitForExecutorsToSettle(): Promise<void> {
    return Promise.all(this.executors.map(executor => executor.promise)).then(noop);
  }
}
