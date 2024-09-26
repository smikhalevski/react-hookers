import { EffectCallback, useEffect } from 'react';
import { useFunction } from './useFunction';
import { emptyArray } from './utils';

/**
 * Returns the protocol that starts and stops an animation loop.
 *
 * When `start` is called the animation loop starts invoking the provided callback using `requestAnimationFrame`. If an
 * animation is already started then it is stopped and started with the new callback.
 *
 * An animation is automatically stopped on unmount.
 *
 * An animation should be started/stopped after the component is mounted. Before that, it is a no-op.
 */
export function useAnimationFrame(): [start: (cb: FrameRequestCallback) => void, stop: () => void] {
  const manager = useFunction(createAnimationFrameManager);

  useEffect(manager.onComponentMounted, emptyArray);

  return [manager.start, manager.stop];
}

interface AnimationFrameManager {
  start: (cb: FrameRequestCallback) => void;
  stop: () => void;
  onComponentMounted: EffectCallback;
}

function createAnimationFrameManager(): AnimationFrameManager {
  let handle: number;
  let isMounted = false;

  const handleStart = (cb: FrameRequestCallback) => {
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

  const handleStop = () => {
    cancelAnimationFrame(handle);
  };

  const handleComponentMounted: EffectCallback = () => {
    isMounted = true;

    return () => {
      isMounted = false;
      handleStop();
    };
  };

  return {
    start: handleStart,
    stop: handleStop,
    onComponentMounted: handleComponentMounted,
  };
}
