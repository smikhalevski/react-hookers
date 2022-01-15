/**
 * Metronome repeatedly calls functions with a fixed time delay between each call.
 */
export class Metronome {

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

  private loop = (): void => {
    try {
      this.callbacks.forEach(call);
    } finally {
      this.schedule();
    }
  };

  private schedule(): void {
    this.stop();
    this.timeout = setTimeout(this.loop, this.ms);
  }

  private stop(): void {
    clearTimeout(this.timeout!);
  }

  /**
   * Adds a new callback for the metronome to call.
   *
   * @param cb The callback to add.
   */
  public add(cb: () => void): void {
    if (this.callbacks.add(cb).size === 1) {
      this.schedule();
    }
  };

  /**
   * Removes the callback for the metronome.
   *
   * @param cb The callback to remove.
   */
  public remove(cb: () => void): void {
    this.callbacks.delete(cb);

    if (this.callbacks.size === 0) {
      this.stop();
    }
  };
}

function call(cb: () => void): void {
  cb();
}
