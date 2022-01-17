/**
 * Metronome repeatedly calls functions with a fixed time delay between each call.
 */
export class Metronome {

  public paused = false;

  private ms: number;
  private timeout: ReturnType<typeof setTimeout> | undefined;
  private callbacks = new Set<() => void>();

  /**
   * Creates a new {@link Metronome} instance.
   *
   * @param ms The number of milliseconds between calls.
   */
  constructor(ms: number) {
    this.ms = ms;
  }

  /**
   * Starts the metronome if it isn't started yet.
   */
  public start(): void {
    this.paused = false;
    this.startLoop();
  }

  /**
   * Pauses the metronome.
   */
  public pause(): void {
    this.paused = true;
    this.stopLoop();
  }

  /**
   * Schedules a callback to be invoked by the metronome.
   *
   * @param cb The callback to schedule.
   * @returns The callback that removes `cb` from the metronome.
   */
  public schedule(cb: () => void): () => void {
    if (this.callbacks.add(cb).size === 1 && !this.paused) {
      this.startLoop();
    }
    return () => {
      this.callbacks.delete(cb);

      if (this.callbacks.size === 0) {
        this.stopLoop();
      }
    };
  };

  private loop = (): void => {
    this.timeout = setTimeout(this.loop, this.ms);
    this.callbacks.forEach(call);
  };

  private startLoop(): void {
    if (this.timeout === undefined && this.callbacks.size !== 0) {
      this.timeout = setTimeout(this.loop, this.ms);
    }
  }

  private stopLoop(): void {
    if (this.timeout === undefined) {
      return;
    }
    clearTimeout(this.timeout);
    this.timeout = undefined;
  }
}

function call(cb: () => void): void {
  cb();
}
