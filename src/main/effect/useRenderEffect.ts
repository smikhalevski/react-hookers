import {DependencyList, EffectCallback, useRef} from 'react';
import {areHookInputsEqual} from '../areHookInputsEqual';
import {useEffectOnce} from './useEffectOnce';
import {isFunction} from '../utils';

/**
 * Analogue of `React.useEffect` that invokes an `effect` synchronously during rendering if `deps` aren't defined or
 * don't equal to deps provided during the previous render. This hook comes in handy when calling an effect during SSR.
 *
 * The optional cleanup callback is called synchronously during rendering.
 *
 * @param effect The callback that is invoked synchronously during rendering if `deps` have changed. An effect may
 *     return a destructor / cleanup callback. The previous effect is cleaned up before executing the next effect.
 * @param deps The optional list of dependencies. If omitted then `effect` is called during every render.
 *
 * @see {@link https://reactjs.org/docs/hooks-reference.html#useeffect React.useEffect}
 */
export function useRenderEffect(effect: EffectCallback, deps?: DependencyList): void {
  const manager = useRef<ReturnType<typeof createRenderEffectManager>>().current ||= createRenderEffectManager();

  manager.__applyEffect(effect, deps);

  useEffectOnce(manager.__effect);
}

function createRenderEffectManager() {

  let prevDeps: DependencyList | undefined;
  let destructor: (() => void) | void;

  const __applyEffect = (effect: EffectCallback, deps: DependencyList | undefined) => {
    if (areHookInputsEqual(deps, prevDeps)) {
      return;
    }
    prevDeps = deps;
    destructor?.();
    destructor = effect();

    if (!isFunction(destructor)) {
      destructor = undefined;
    }
  };

  const __effect: EffectCallback = () => () => {
    destructor?.();
  };

  return {
    __applyEffect,
    __effect,
  };
}
