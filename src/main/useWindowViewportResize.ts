import { PubSub } from 'parallel-universe';
import { EffectCallback, useLayoutEffect } from 'react';
import { useFunction } from './useFunction';
import { emptyArray } from './utils/lang';
import { getWindowViewportRect } from './utils/rects';

/**
 * Calls {@link onResize} when window viewport size is changed either by a window resize or by a software keyboard
 * being shown.
 *
 * @group Other
 */
export function useWindowViewportResize(onResize: (rect: DOMRectReadOnly) => void): void {
  const manager = useFunction(createWindowViewportResizeManager);

  manager.onResize = onResize;

  useLayoutEffect(manager.onMounted, emptyArray);
}

interface WindowViewportResizeManager {
  onResize: (rect: DOMRectReadOnly) => void;
  onMounted: EffectCallback;
}

function createWindowViewportResizeManager(): WindowViewportResizeManager {
  const handleMounted: EffectCallback = () => {
    (0, manager.onResize)(getWindowViewportRect());

    const unsubscribe = windowViewportResizePubSub.subscribe(rect => (0, manager.onResize)(rect));
    const target = window.visualViewport || window;

    if (windowViewportResizePubSub.listenerCount === 1) {
      target.addEventListener('resize', handleWindowViewportResize);
    }

    return () => {
      unsubscribe();

      if (windowViewportResizePubSub.listenerCount === 0) {
        target.removeEventListener('resize', handleWindowViewportResize);
      }
    };
  };

  const manager: WindowViewportResizeManager = {
    onResize: undefined!,
    onMounted: handleMounted,
  };

  return manager;
}

const windowViewportResizePubSub = new PubSub<DOMRectReadOnly>();

function handleWindowViewportResize() {
  windowViewportResizePubSub.publish(getWindowViewportRect());
}
