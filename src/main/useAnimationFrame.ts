import { EffectCallback, useRef } from 'react';
import { emptyDeps, noop } from './utils';
import { useInsertionEffect } from './useInsertionEffect';

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

  useInsertionEffect(manager.effect, emptyDeps);

  return [manager.start, manager.stop];
}

function createAnimationFrameManager() {
  let _start: (cb: FrameRequestCallback) => void = noop;
  let _stop: () => void = noop;

  const effect: EffectCallback = () => {
    let handle: number;

    _start = cb => {
      _stop();

      const loop: FrameRequestCallback = time => {
        cb(time);
        handle = requestAnimationFrame(loop);
      };
      handle = requestAnimationFrame(loop);
    };

    _stop = () => {
      cancelAnimationFrame(handle);
    };

    return () => {
      _stop();
      _start = _stop = noop;
    };
  };

  return {
    effect,
    start(cb: FrameRequestCallback): void {
      _start(cb);
    },
    stop(): void {
      _stop();
    },
  };
}
