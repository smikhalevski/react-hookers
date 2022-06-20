import {EffectCallback, useRef} from 'react';
import {useEffectOnce} from '../effect';

export type AnimationCallbackProtocol = [pasue: () => void, resume: () => void, playing: boolean];

/**
 * Calls a function on every {@link requestAnimationFrame}. With controls of pausing and resuming.
 */
export function useAnimationCallback(cb: FrameRequestCallback): Readonly<AnimationCallbackProtocol> {
  const manager = useRef<ReturnType<typeof createAnimationCallbackManager>>().current ||= createAnimationCallbackManager();

  manager.__setCallback(cb);

  useEffectOnce(manager.__effect);

  return manager.__protocol;
}

function createAnimationCallbackManager() {

  let handle: number;
  let cb: FrameRequestCallback;

  const resume = () => {
    cancelAnimationFrame(handle);

    const loop: FrameRequestCallback = (time) => {
      cb(time);
      handle = requestAnimationFrame(loop);
    };

    __protocol[2] = true;
    handle = requestAnimationFrame(loop);
  };

  const pause = () => {
    __protocol[2] = false;
    cancelAnimationFrame(handle);
  };

  const __setCallback = (nextCb: FrameRequestCallback) => {
    cb = nextCb;
  };

  const __effect: EffectCallback = () => {
    resume();
    return pause;
  };

  const __protocol: AnimationCallbackProtocol = [pause, resume, false];

  return {
    __setCallback,
    __effect,
    __protocol,
  };
}
