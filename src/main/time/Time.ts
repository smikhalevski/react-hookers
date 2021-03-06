import {EventBus} from '@smikhalevski/event-bus';

export class Time {

  private readonly _eventBus = new EventBus();

  /**
   * The offset in milliseconds between `Date.now()` and timestamp returned by {@link now}.
   */
  public offset = 0;

  /**
   * Returns current timestamp.
   *
   * @return The current timestamp in milliseconds.
   */
  public now(): number {
    return Date.now() + this.offset;
  }

  /**
   * Sets current timestamp.
   *
   * @param timestamp The timestamp that would be used as an offset for calculating {@link now}.
   */
  public setTimestamp(timestamp: number): void {
    const prevOffset = this.offset;
    const currOffset = this.offset = timestamp - Date.now();

    if (prevOffset !== currOffset) {
      this._eventBus.publish();
    }
  }

  /**
   * Subscribes listener to updates of the timestamp offset.
   */
  public subscribe(listener: () => void): () => void {
    return this._eventBus.subscribe(listener);
  }
}
