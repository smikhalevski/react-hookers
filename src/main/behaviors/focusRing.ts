import { PubSub } from 'parallel-universe';

const focusRingPubSub = new PubSub();

/**
 * A visual focus indicator that is shown around a focused element.
 *
 * @group Behaviors
 */
export const focusRing = {
  /**
   * `true` if the focus ring is currently visible.
   */
  isVisible: false,

  /**
   * Reveals the focus ring.
   */
  reveal(): void {
    if (!focusRing.isVisible) {
      focusRing.isVisible = true;
      focusRingPubSub.publish();
    }
  },

  /**
   * Conceals the focus ring.
   */
  conceal(): void {
    if (focusRing.isVisible) {
      focusRing.isVisible = false;
      focusRingPubSub.publish();
    }
  },

  /**
   * Subscribes a listener to focus ring visibility changes.
   *
   * @param listener A callback invoked when focus ring visibility changes.
   * @returns A function that unsubscribes the listener.
   */
  subscribe(listener: () => void): () => void {
    const unsubscribe = focusRingPubSub.subscribe(listener);

    if (focusRingPubSub.listenerCount === 1) {
      document.addEventListener('keydown', handleFocusRingReveal, true);
      document.addEventListener('keyup', handleFocusRingReveal, true);
      document.addEventListener('mousedown', handleFocusRingConceal, true);
      document.addEventListener('pointerdown', handleFocusRingConceal, true);
    }

    return () => {
      unsubscribe();

      if (focusRingPubSub.listenerCount !== 0) {
        return;
      }

      focusRing.isVisible = false;

      document.removeEventListener('keydown', handleFocusRingReveal, true);
      document.removeEventListener('keyup', handleFocusRingReveal, true);
      document.removeEventListener('mousedown', handleFocusRingConceal, true);
      document.removeEventListener('pointerdown', handleFocusRingConceal, true);
    };
  },
};

function handleFocusRingReveal(event: KeyboardEvent): void {
  if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }
  focusRing.reveal();
}

function handleFocusRingConceal(): void {
  focusRing.conceal();
}
