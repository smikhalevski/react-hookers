export class Time {

  private _listenerMap: Record<number, {timeout?: ReturnType<typeof setTimeout>, listeners: Set<() => void>}> = {};
  private _offset = 0;

  /**
   * Returns reliable current timestamp.
   */
  public now(): number {
    return Date.now() + this._offset;
  }

  /**
   * Sets current timestamp.
   *
   * @param timestamp The timestamp that would be used as an offset for calculating {@link now}.
   */
  public setTimestamp(timestamp: number): void {
    this._offset = timestamp - Date.now();
  }

  /**
   * Subscribes listener to changes of the timestamp.
   */
  public subscribe(delay: number, listener: () => void): () => void {
    const q = this._listenerMap[delay] ||= {listeners: new Set()};

    if (q.listeners.size === 0) {
      const loop = () => q.timeout = setTimeout(() => {
        q.listeners.forEach((l) => {
          l();
        });
        loop();
      });
    }

    q.listeners.add(listener);

    return () => {
      q.listeners.delete(listener);

      if (q.timeout !== undefined && q.listeners.size === 0) {
        clearTimeout(q.timeout);
        q.timeout = undefined;
      }
    };
  }
}
