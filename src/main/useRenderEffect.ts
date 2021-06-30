import React from 'react';
import {isEqualArrays} from './isEqualArrays';

const EMPTY_DEPS: React.DependencyList = [];

/**
 * Analogue of `React.useEffect` that invokes `effect` synchronously during rendering if `deps` aren't defined or
 * doesn't equals deps provided during the previous render.
 */
export function useRenderEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  const manager = React.useRef<ReturnType<typeof createManager>>().current ||= createManager();

  manager.apply(effect, deps);
  React.useEffect(manager.effect, EMPTY_DEPS);
}

function createManager() {

  let prevDeps: React.DependencyList | undefined;
  let destructor: (() => void) | void;

  const apply = (effect: React.EffectCallback, deps: React.DependencyList | undefined) => {
    if (prevDeps != null && deps != null && isEqualArrays(prevDeps, deps)) {
      return;
    }
    prevDeps = deps;
    destructor?.();
    destructor = effect();

    if (typeof destructor !== 'function') {
      destructor = undefined;
    }
  };

  const effect: React.EffectCallback = () => () => destructor?.();

  return {
    apply,
    effect,
  };
}
