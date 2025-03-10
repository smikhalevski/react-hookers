import { PubSub } from 'parallel-universe';

const cursorPubSub = new PubSub();

/**
 * A cursor activation status controller.
 *
 * @group Behaviors
 */
export const cursor = {
  /**
   * `true` if cursor interactions are enabled.
   */
  isActive: true,

  /**
   * Enables interactions with cursor.
   */
  activate(): void {
    if (!cursor.isActive) {
      cursor.isActive = true;
      cursorPubSub.publish();
    }
  },

  /**
   * Disables interactions with cursor.
   */
  deactivate(): void {
    if (cursor.isActive) {
      cursor.isActive = false;
      cursorPubSub.publish();
    }
  },

  /**
   * Subscribes a listener to cursor activation status changes.
   *
   * @param listener A listener to call when cursor activation status has changed.
   * @returns A callback that unsubscribes a listener.
   */
  subscribe(listener: () => void): () => void {
    const unsubscribe = cursorPubSub.subscribe(listener);

    if (cursorPubSub.listenerCount === 1) {
      window.addEventListener('mousemove', handleCursorActivate, true);
      window.addEventListener('mousedown', handleCursorActivate, true);
      window.addEventListener('mouseup', handleCursorActivate, true);
    }

    return () => {
      unsubscribe();

      if (cursorPubSub.listenerCount !== 0) {
        return;
      }

      cursor.isActive = true;

      window.removeEventListener('mousemove', handleCursorActivate, true);
      window.removeEventListener('mousedown', handleCursorActivate, true);
      window.removeEventListener('mouseup', handleCursorActivate, true);
    };
  },
};

function handleCursorActivate(): void {
  cursor.activate();
}
