import {DependencyList, EffectCallback, useRef} from 'react';
import {areHookInputsEqual} from '../areHookInputsEqual';
import {useEffectOnce} from './useEffectOnce';

/**
 * Analogue of `React.useEffect` that invokes an `effect` synchronously during rendering if `deps` aren't defined or
 * don't equal to deps provided during the previous render. This hook comes handy when you need to call an effect
 * during SSR.
 *
 * @param effect The callback that is invoked synchronously during rendering if `deps` have changed. An effect may
 *     return a destructor / cleanup callback. The previous effect is cleaned up before executing the next effect.
 * @param [deps] Optional list of dependencies. If omitted then `effect` is called during every render.
 *
 * @see https://reactjs.org/docs/hooks-reference.html#useeffect React.useEffect
 */
export function useRenderEffect(effect: EffectCallback, deps?: DependencyList): void {
  const manager = useRef<ReturnType<typeof createRenderEffectManager>>().current ||= createRenderEffectManager();

  manager._applyEffect(effect, deps);
  useEffectOnce(manager._effect);
}

function createRenderEffectManager() {

  let prevDeps: DependencyList | undefined;
  let destructor: (() => void) | void;

  const _applyEffect = (effect: EffectCallback, deps: DependencyList | undefined) => {
    if (areHookInputsEqual(deps, prevDeps)) {
      return;
    }
    prevDeps = deps;
    destructor?.();
    destructor = effect();

    if (typeof destructor !== 'function') {
      destructor = undefined;
    }
  };

  const _effect: EffectCallback = () => () => {
    destructor?.();
  };

  return {
    _applyEffect,
    _effect,
  };
}
