import { AbortableCallback, AbortablePromise, Executor } from 'parallel-universe';

export class ManagedExecutor<T = any> extends Executor<T> {
  executee: AbortableCallback<T> | null = null;

  execute(cb: AbortableCallback<T>): AbortablePromise<T> {
    this.executee = cb;
    return super.execute(cb);
  }
}
