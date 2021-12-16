export class Time {

  /**
   * The offset in milliseconds between `Date.now()` and timestamp returned by {@link Time.now}.
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
   * @param timestamp The timestamp that would be used as an offset for calculating {@link Time.now}.
   */
  public setTimestamp(timestamp: number): void {
    this.offset = timestamp - Date.now();
  }
}
