import {DependencyList, EffectCallback, useRef} from 'react';
import {areHookInputsEqual} from './areHookInputsEqual';
import {useEffectOnce} from './useEffectOnce';

/**
 * Analogue of `React.useEffect` that invokes an `_effect` synchronously during rendering if `deps` aren't defined or
 * don't equal to deps provided during the previous render. This hook comes handy when you need to call an _effect
 * during SSR.
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

  const _effect: EffectCallback = () => () => destructor?.();

  return {
    _applyEffect,
    _effect,
  };
}
