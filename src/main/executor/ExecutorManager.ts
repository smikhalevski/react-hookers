import { Executor } from 'parallel-universe';

export class ExecutorManager {
  executors = new Map<unknown, Executor>();

  getOrCreateExecutor(key: unknown): Executor {
    return this.executors.get(key) || this.executors.set(key, new Executor()).get(key)!;
  }

  invalidate(key: unknown): void {
    const executor = this.executors.get(key);

    if (executor?.executee) {
      void executor.execute(executor.executee);
    }
  }
}
