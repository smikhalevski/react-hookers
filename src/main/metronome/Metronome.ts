/**
 * Metronome repeatedly calls functions with a fixed time delay between each call.
 */
export class Metronome {
  public paused = false;

  private _ms: number;
  private _timeout: ReturnType<typeof setTimeout> | undefined;
  private _callbacks = new Set<() => void>();

  /**
   * Creates a new {@link Metronome} instance.
   *
   * @param ms The number of milliseconds between calls.
   */
  constructor(ms: number) {
    this._ms = ms;
  }

  /**
   * Starts the metronome if it isn't started yet.
   */
  public start(): void {
    this.paused = false;
    this._startLoop();
  }

  /**
   * Pauses the metronome.
   */
  public pause(): void {
    this.paused = true;
    this._stopLoop();
  }

  /**
   * Schedules a callback to be invoked by the metronome.
   *
   * @param cb The callback to schedule.
   * @returns The callback that removes `cb` from the metronome.
   */
  public schedule(cb: () => void): () => void {
    if (this._callbacks.add(cb).size === 1 && !this.paused) {
      this._startLoop();
    }
    return () => {
      this._callbacks.delete(cb);

      if (this._callbacks.size === 0) {
        this._stopLoop();
      }
    };
  }

  private _loop = (): void => {
    this._timeout = setTimeout(this._loop, this._ms);
    this._callbacks.forEach(call);
  };

  private _startLoop(): void {
    if (this._timeout === undefined && this._callbacks.size !== 0) {
      this._timeout = setTimeout(this._loop, this._ms);
    }
  }

  private _stopLoop(): void {
    if (this._timeout === undefined) {
      return;
    }
    clearTimeout(this._timeout);
    this._timeout = undefined;
  }
}

function call(cb: () => void): void {
  cb();
}
