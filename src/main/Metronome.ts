/**
 * Metronome repeatedly calls functions with a fixed time delay between each call.
 */
export class Metronome {
  isPaused = false;

  private _ms: number;
  private _callbacks: Array<() => void> = [];
  private _timeout: NodeJS.Timeout | number | null = null;

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
  start(): void {
    this.isPaused = false;
    this._startLoop();
  }

  /**
   * Pauses the metronome.
   */
  pause(): void {
    this.isPaused = true;
    this._stopLoop();
  }

  /**
   * Schedules a callback to be invoked by the metronome.
   *
   * @param cb The callback to schedule.
   * @returns The callback that removes `cb` from the metronome.
   */
  schedule(cb: () => void): () => void {
    const { _callbacks } = this;

    if (_callbacks.push(cb) === 1 && !this.isPaused) {
      this._startLoop();
    }
    return () => {
      const index = _callbacks.indexOf(cb);

      if (index === -1) {
        return;
      }
      _callbacks.splice(index, 1);

      if (_callbacks.length === 0) {
        this._stopLoop();
      }
    };
  }

  private _loop = (): void => {
    this._timeout = setTimeout(this._loop, this._ms);

    for (const cb of this._callbacks) {
      cb();
    }
  };

  private _startLoop(): void {
    if (this._timeout === null && this._callbacks.length !== 0) {
      this._timeout = setTimeout(this._loop, this._ms);
    }
  }

  private _stopLoop(): void {
    if (this._timeout === null) {
      return;
    }
    clearTimeout(this._timeout);
    this._timeout = null;
  }
}
