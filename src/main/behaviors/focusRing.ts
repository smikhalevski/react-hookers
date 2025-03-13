import { PubSub } from 'parallel-universe';

const focusRingPubSub = new PubSub();

/**
 * A focus indication that should be shown around a focused element.
 *
 * @group Behaviors
 */
export const focusRing = {
  /**
   * `true` if a focus ring must be visible to a user.
   */
  isVisible: false,

  /**
   * Reveals the focus ring to a user.
   */
  reveal(): void {
    if (!focusRing.isVisible) {
      focusRing.isVisible = true;
      focusRingPubSub.publish();
    }
  },

  /**
   * Conceals the focus ring from a user.
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
   * @param listener A listener to call when focus ring visibility has changed.
   * @returns A callback that unsubscribes a listener.
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
