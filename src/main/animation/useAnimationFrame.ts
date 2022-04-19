import {EffectCallback, useRef} from 'react';
import {useEffectOnce} from '../effect';

export type AnimationFrameProtocol = [start: (cb: FrameRequestCallback) => void, stop: () => void];

/**
 * Returns protocol to start and stop an animation loop.
 *
 * When `start` is called the animation loop starts invoking the provided callback using `requestAnimationFrame`. If
 * animation was already pending then it is stopped and started with the new callback.
 */
export function useAnimationFrame(): Readonly<AnimationFrameProtocol> {
  const manager = useRef<ReturnType<typeof createAnimationFrameManager>>().current ||= createAnimationFrameManager();

  useEffectOnce(manager.__effect);

  return manager.__protocol;
}

function createAnimationFrameManager() {

  let handle: number;

  const start = (cb: FrameRequestCallback): void => {
    stop();

    const loop: FrameRequestCallback = (time) => {
      cb(time);
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
  };

  const stop = (): void => {
    cancelAnimationFrame(handle);
  };

  const __effect: EffectCallback = () => stop;

  return {
    __effect,
    __protocol: [start, stop] as const,
  };
}
