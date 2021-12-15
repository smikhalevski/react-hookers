interface IInterval {

  /**
   * The currently pending timeout.
   */
  _timeout: ReturnType<typeof setTimeout> | null;

  /**
   * The set of listeners that are subscribed to the interval.
   */
  _listeners: Set<() => void>;
}

export class IntervalManager {

  /**
   * The map from the delay to corresponding {@link IInterval}.
   */
  private _intervalMap = new Map<number, IInterval>();

  /**
   * Schedules a listener to be invoked after each interval.
   *
   * @param delay The interval duration in milliseconds.
   * @param listener The listener to invoke.
   */
  public scheduleInterval(listener: () => void, delay: number): () => void {

    const interval = this._getOrCreateInterval(delay);
    const listeners = interval._listeners;

    if (listeners.size === 0) {
      const nextTick = () => {
        interval._timeout = setTimeout(() => {
          listeners.forEach((listener) => listener());
          nextTick();
        }, delay);
      };
      nextTick();
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);

      if (listeners.size === 0) {
        clearTimeout(interval._timeout!);
      }
    };
  }

  private _getOrCreateInterval(delay: number): IInterval {
    let interval = this._intervalMap.get(delay);

    if (!interval) {
      interval = {
        _timeout: null,
        _listeners: new Set(),
      };
      this._intervalMap.set(delay, interval);
    }

    return interval;
  }
}
