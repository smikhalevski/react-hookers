import {EffectCallback, useRef} from 'react';
import {useEffectOnce} from '../effect';

export type AnimationFrameProtocol = [start: (cb: FrameRequestCallback) => void, stop: () => void, playing: boolean];

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

  const start = (cb: FrameRequestCallback) => {
    cancelAnimationFrame(handle);

    const loop: FrameRequestCallback = (time) => {
      cb(time);
      handle = requestAnimationFrame(loop);
    };

    __protocol[2] = true;
    handle = requestAnimationFrame(loop);
  };

  const stop = () => {
    __protocol[2] = false;
    cancelAnimationFrame(handle);
  };

  const __effect: EffectCallback = () => stop;

  const __protocol: AnimationFrameProtocol = [start, stop, false];

  return {
    __effect,
    __protocol,
  };
}
