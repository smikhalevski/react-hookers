import { noop } from '../utils';
import { ManagedExecutor } from './ManagedExecutor';

export class ExecutorManager {
  executors = new Map<unknown, ManagedExecutor>();

  getOrCreateExecutor(key: unknown): ManagedExecutor {
    return this.executors.get(key) || this.executors.set(key, new ManagedExecutor()).get(key)!;
  }

  invalidate(key: unknown): void {
    const executor = this.executors.get(key);

    if (executor !== undefined && !executor.isPending && executor.executee !== null) {
      void executor.execute(executor.executee).catch(noop);
    }
  }
}
