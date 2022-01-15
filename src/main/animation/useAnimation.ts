import {useRef} from 'react';
import {useEffectOnce} from '../effect';

export type AnimationProtocol = [start: (cb: FrameRequestCallback) => void, stop: () => void];

/**
 * Returns protocol to start and stop an animation loop.
 *
 * When `start` is called the animation loop starts invoking the provided callback using `requestAnimationFrame`. If
 * animation was already pending then it is stopped and started with the new callback.
 *
 * ```ts
 * const [start, stop] = useAnimation();
 *
 * useEffect(() => {
 *
 *   start(() => {
 *     // Compute animation
 *   });
 * }, []);
 * ```
 */
export function useAnimation(): Readonly<AnimationProtocol> {
  const manager = useRef<ReturnType<typeof createAnimationManager>>().current ||= createAnimationManager();

  useEffectOnce(manager._effect);

  return manager._protocol;
}

function createAnimationManager() {

  let count: number;

  const start = (cb: FrameRequestCallback) => {
    stop();

    const index = count;

    const loop: FrameRequestCallback = (time) => {
      if (index === count) {
        cb(time);
        requestAnimationFrame(loop);
      }
    };
    requestAnimationFrame(loop);
  };

  const stop = () => {
    ++count;
  };

  const _effect = () => stop;

  return {
    _effect,
    _protocol: [start, stop] as const,
  };
}
