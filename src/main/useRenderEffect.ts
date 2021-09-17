import {DependencyList, EffectCallback, useEffect, useRef} from 'react';
import {areHookInputsEqual} from './areHookInputsEqual';

const NO_DEPS: DependencyList = [];

/**
 * Analogue of `React.useEffect` that invokes an `effect` synchronously during rendering if `deps` aren't defined or
 * don't equal to deps provided during the previous render. This hook comes handy when you need to call an effect
 * during SSR.
 */
export function useRenderEffect(effect: EffectCallback, deps?: DependencyList): void {
  const manager = useRef<ReturnType<typeof createRenderEffectManager>>().current ||= createRenderEffectManager();

  manager.applyEffect(effect, deps);
  useEffect(manager.effect, NO_DEPS);
}

function createRenderEffectManager() {

  let prevDeps: DependencyList | undefined;
  let destructor: (() => void) | void;

  const applyEffect = (effect: EffectCallback, deps: DependencyList | undefined) => {
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

  const effect: EffectCallback = () => () => destructor?.();

  return {
    applyEffect,
    effect,
  };
}
