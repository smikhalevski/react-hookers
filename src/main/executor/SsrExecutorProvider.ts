import {Executor} from './Executor';
import {noop} from '../utils';
import {ExecutorProvider} from './ExecutorProvider';

/**
 * The executor provider that keeps references to all created executors and provides batch operation for them.
 */
export class SsrExecutorProvider implements ExecutorProvider {

  public executors = new Set<Executor>();

  public createExecutor<T>(listener: () => void): Executor<T> {
    const executor = new Executor<any>(listener);
    this.executors.add(executor);
    return executor;
  }

  public disposeExecutor(executor: Executor): void {
    if (this.executors.delete(executor)) {
      executor.dispose();
    }
  }

  /**
   * Returns `true` is any of the executors are pending.
   */
  public hasPendingExecutors(): boolean {
    let pending = false;
    this.executors.forEach((executor) => pending ||= executor.pending);
    return pending;
  }

  /**
   * Aborts all pending executors.
   */
  public abortExecutors(): void {
    this.executors.forEach((executor) => {
      executor.abort();
    });
  }

  /**
   * Creates a new promise that is resolved as soon as all pending executors are resolved. All executions that started
   * after the {@link waitForExecutorsToComplete} call won't be considered and won't affect the returned promise.
   */
  public waitForExecutorsToComplete(): Promise<void> {
    const promises: Promise<void>[] = [];

    this.executors.forEach((executor) => {
      if (executor.promise) {
        promises.push(executor.promise.then(noop, noop));
      }
    });
    return Promise.all(promises).then(noop);
  }
}
