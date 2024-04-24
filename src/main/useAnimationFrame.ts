import { EffectCallback, useEffect, useRef } from 'react';
import { emptyDeps, noop } from './utils';

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
  const manager = (useRef<ReturnType<typeof createAnimationFrameManager>>().current ||= createAnimationFrameManager());

  useEffect(manager.effect, emptyDeps);

  return [manager.start, manager.stop];
}

function createAnimationFrameManager() {
  let doStart: (cb: FrameRequestCallback) => void = noop;
  let doStop: () => void = noop;

  const effect: EffectCallback = () => {
    let handle: number;

    doStart = cb => {
      doStop();

      const loop: FrameRequestCallback = time => {
        cb(time);
        handle = requestAnimationFrame(loop);
      };
      handle = requestAnimationFrame(loop);
    };

    doStop = () => {
      cancelAnimationFrame(handle);
    };

    return () => {
      doStop();
      doStart = doStop = noop;
    };
  };

  return {
    effect,
    start(cb: FrameRequestCallback): void {
      doStart(cb);
    },
    stop(): void {
      doStop();
    },
  };
}
