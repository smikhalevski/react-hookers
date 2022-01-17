import {Executor, ExecutorCallback} from '../executor';
import {Metronome} from '../metronome';

export class PollingExecutor<T = unknown> extends Executor<T> {

  private _metronome;
  private _cancel: (() => void) | undefined;

  public constructor(listener: () => void, metronome: Metronome) {
    super(listener);
    this._metronome = metronome;
  }

  public execute(cb: ExecutorCallback<T>): Promise<void> {
    this.abort();
    this._cancel = this._metronome.schedule(() => {
      if (!this.pending) {
        super.execute(cb);
      }
    });
    return Promise.resolve();
  }

  public abort(): this {
    this._cancel?.();
    return super.abort();
  }
}
