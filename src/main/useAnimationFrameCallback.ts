import { type EffectCallback, useLayoutEffect } from 'react';
import { useFunctionOnce } from './useFunctionOnce.js';
import { emptyArray } from './utils/lang.js';

/**
 * Starts an animation loop after the component is mounted and stops it when the component is unmounted.
 *
 * @param cb A callback that is invoked on each animation frame.
 * @see {@link useAnimationFrame}
 * @group Other
 */
export function useAnimationFrameCallback(cb: FrameRequestCallback): void {
  const manager = useFunctionOnce(createAnimationFrameCallbackManager);

  manager.cb = cb;

  useLayoutEffect(manager.onMounted, emptyArray);
}

interface AnimationFrameCallbackManager {
  cb: FrameRequestCallback;
  onMounted: EffectCallback;
}

function createAnimationFrameCallbackManager(): AnimationFrameCallbackManager {
  const handleMounted: EffectCallback = () => {
    const frameRequestCallback: FrameRequestCallback = time => {
      (0, manager.cb)(time);
      requestAnimationFrame(frameRequestCallback);
    };

    const handle = requestAnimationFrame(frameRequestCallback);

    return () => cancelAnimationFrame(handle);
  };

  const manager: AnimationFrameCallbackManager = {
    cb: undefined!,
    onMounted: handleMounted,
  };

  return manager;
}
