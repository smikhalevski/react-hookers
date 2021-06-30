export type EventListener<T> = (event: T) => boolean | void;

export class EventBus<T> {

  private cbs: Array<EventListener<T>> = [];

  public publish(event: T): void {
    for (let i = 0; i < this.cbs.length; i++) {
      this.cbs[i](event);
    }
  }

  public subscribe(cb: EventListener<T>): () => void {
    if (this.cbs.indexOf(cb) === -1) {
      this.cbs.push(cb);
    }
    return () => this.cbs.splice(this.cbs.indexOf(cb), 1);
  }
}
