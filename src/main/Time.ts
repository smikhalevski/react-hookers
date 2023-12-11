import { PubSub } from 'parallel-universe';

export class Time {
  private _pubSub = new PubSub();

  /**
   * The offset in milliseconds between `Date.now()` and timestamp returned by {@link now}.
   */
  offset = 0;

  /**
   * Returns current timestamp.
   *
   * @return The current timestamp in milliseconds.
   */
  now(): number {
    return Date.now() + this.offset;
  }

  /**
   * Sets current timestamp.
   *
   * @param timestamp The timestamp that would be used as an offset for calculating {@link now}.
   */
  setTimestamp(timestamp: number): void {
    const { offset } = this;

    const nextOffset = timestamp - Date.now();

    if (offset !== nextOffset) {
      this.offset = nextOffset;
      this._pubSub.publish();
    }
  }

  /**
   * Subscribes listener to updates of the timestamp offset.
   */
  subscribe(listener: () => void): () => void {
    return this._pubSub.subscribe(listener);
  }
}
