import { EffectCallback, useEffect } from 'react';
import { useFunctionOnce } from './useFunctionOnce.js';
import { emptyArray } from './utils/lang.js';
import { getViewportRect } from './utils/rects.js';

/**
 * Props of the {@link useViewport} hook.
 *
 * @group Other
 */
export interface ViewportProps {
  /**
   * A handler that is called when a viewport is resized.
   *
   * @param rect A viewport bounding rect.
   */
  onResize?: (rect: DOMRect) => void;
}

/**
 * Observes visual viewport changes.
 *
 * @group Other
 */
export function useViewport(props: ViewportProps): void {
  const manager = useFunctionOnce(createViewportManager);

  manager.props = props;

  useEffect(manager.onMounted, emptyArray);
}

interface WindowViewportResizeManager {
  props: ViewportProps;
  onMounted: EffectCallback;
}

function createViewportManager(): WindowViewportResizeManager {
  const handleMounted: EffectCallback = () => {
    const viewport = window.visualViewport || window;

    viewport.addEventListener('resize', handleResize);

    return () => viewport.removeEventListener('resize', handleResize);
  };

  const handleResize = (): void => {
    const { onResize } = manager.props;

    onResize?.(getViewportRect());
  };

  const manager: WindowViewportResizeManager = {
    props: undefined!,
    onMounted: handleMounted,
  };

  return manager;
}
