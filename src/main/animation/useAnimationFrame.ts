import { EffectCallback, useRef } from 'react';
import { noop } from '../utils';
import { useEffectOnce } from '../effect';

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

  useEffectOnce(manager.__effect);

  return [manager.__start, manager.__stop];
}

function createAnimationFrameManager() {
  let start: (cb: FrameRequestCallback) => void = noop;
  let stop: () => void = noop;

  const __effect: EffectCallback = () => {
    let handle: number;

    start = cb => {
      stop();

      const loop: FrameRequestCallback = time => {
        cb(time);
        handle = requestAnimationFrame(loop);
      };
      handle = requestAnimationFrame(loop);
    };

    stop = () => {
      cancelAnimationFrame(handle);
    };

    return () => {
      stop();
      start = stop = noop;
    };
  };

  return {
    __effect,
    __start(cb: FrameRequestCallback): void {
      start(cb);
    },
    __stop(): void {
      stop();
    },
  };
}
