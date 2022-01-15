import {useRef} from 'react';
import {useEffectOnce} from '../effect';

export type AnimationFrameProtocol = [start: (cb: FrameRequestCallback) => void, stop: () => void];

/**
 * Returns protocol to start and stop an animation loop.
 *
 * When `start` is called the animation loop starts invoking the provided callback using `requestAnimationFrame`. If
 * animation was already pending then it is stopped and started with the new callback.
 *
 * ```ts
 * const [start, stop] = useAnimationFrame();
 *
 * useEffect(() => {
 *
 *   start(() => {
 *     // Compute animation
 *   });
 * }, []);
 * ```
 */
export function useAnimationFrame(): Readonly<AnimationFrameProtocol> {
  const manager = useRef<ReturnType<typeof createAnimationFrameManager>>().current ||= createAnimationFrameManager();

  useEffectOnce(manager._effect);

  return manager._protocol;
}

function createAnimationFrameManager() {

  let handle: number;

  const start = (cb: FrameRequestCallback) => {
    stop();

    const loop: FrameRequestCallback = (time) => {
      cb(time);
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
  };

  const stop = () => {
    cancelAnimationFrame(handle);
  };

  const _effect = () => stop;

  return {
    _effect,
    _protocol: [start, stop] as const,
  };
}
