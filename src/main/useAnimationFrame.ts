import { EffectCallback, useLayoutEffect } from 'react';
import { useFunction } from './useFunction';
import { emptyArray } from './utils/lang';

/**
 * Returns the protocol that starts and stops an animation loop.
 *
 * When `start` is called the animation loop starts invoking the provided callback using `requestAnimationFrame`. If an
 * animation is already started then it is stopped and started with the new callback.
 *
 * An animation is automatically stopped on unmount.
 *
 * An animation should be started/stopped after the component is mounted. Before that, it is a no-op.
 *
 * @example
 * const [start, stop] = useAnimationFrame();
 *
 * useEffect(() => {
 *   // Cancels pending animation loop and schedules the new animation loop
 *   start(() => {
 *     // Apply animation changes
 *   });
 *
 *   // Stop the animation
 *   stop();
 * }, []);
 *
 * @group Other
 */
export function useAnimationFrame(): [start: (cb: FrameRequestCallback) => void, stop: () => void] {
  const manager = useFunction(createAnimationFrameManager);

  useLayoutEffect(manager.onMounted, emptyArray);

  return [manager.start, manager.stop];
}

interface AnimationFrameManager {
  start: (cb: FrameRequestCallback) => void;
  stop: () => void;
  onMounted: EffectCallback;
}

function createAnimationFrameManager(): AnimationFrameManager {
  let isMounted = false;
  let handle: number;

  const handleStart = (cb: FrameRequestCallback): void => {
    if (!isMounted) {
      return;
    }

    handleStop();

    const frameRequestCallback: FrameRequestCallback = time => {
      cb(time);
      handle = requestAnimationFrame(frameRequestCallback);
    };

    handle = requestAnimationFrame(frameRequestCallback);
  };

  const handleStop = (): void => cancelAnimationFrame(handle);

  const handleMounted: EffectCallback = () => {
    isMounted = true;

    return () => {
      isMounted = false;
      handleStop();
    };
  };

  return {
    start: handleStart,
    stop: handleStop,
    onMounted: handleMounted,
  };
}
