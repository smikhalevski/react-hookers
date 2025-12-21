import { PubSub } from 'parallel-universe';

const cursorPubSub = new PubSub();

/**
 * Controls the cursor activation state.
 *
 * @group Behaviors
 */
export const cursor = {
  /**
   * `true` if cursor interactions are currently enabled.
   */
  isActive: true,

  /**
   * Enables cursor interactions.
   */
  activate(): void {
    if (!cursor.isActive) {
      cursor.isActive = true;
      cursorPubSub.publish();
    }
  },

  /**
   * Disables cursor interactions.
   */
  deactivate(): void {
    if (cursor.isActive) {
      cursor.isActive = false;
      cursorPubSub.publish();
    }
  },

  /**
   * Subscribes a listener to cursor activation state changes.
   *
   * @param listener A callback invoked when the cursor activation state changes.
   * @returns A function that unsubscribes the listener.
   */
  subscribe(listener: () => void): () => void {
    const unsubscribe = cursorPubSub.subscribe(listener);

    if (cursorPubSub.listenerCount === 1) {
      window.addEventListener('mousemove', handleCursorActivate, true);
      window.addEventListener('mousedown', handleCursorActivate, true);
    }

    return () => {
      unsubscribe();

      if (cursorPubSub.listenerCount !== 0) {
        return;
      }

      cursor.isActive = true;

      window.removeEventListener('mousemove', handleCursorActivate, true);
      window.removeEventListener('mousedown', handleCursorActivate, true);
    };
  },
};

function handleCursorActivate(): void {
  cursor.activate();
}
