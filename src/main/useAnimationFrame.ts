import { EffectCallback, useLayoutEffect } from 'react';
import { useFunctionOnce } from './useFunctionOnce.js';
import { emptyArray } from './utils/lang.js';

/**
 * Returns an API that starts and stops an animation loop.
 *
 * When `start` is called, the animation loop begins invoking the provided callback using `requestAnimationFrame`.
 * If an animation is already running, it is stopped and restarted with the new callback.
 *
 * The animation is automatically stopped when the component unmounts.
 *
 * The animation should be started or stopped only after the component has mounted. Before that, calling either function
 * is a no-op.
 *
 * @example
 * const [start, stop] = useAnimationFrame();
 *
 * useEffect(() => {
 *   // Cancels any pending animation loop and schedules a new one
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
  const manager = useFunctionOnce(createAnimationFrameManager);

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
