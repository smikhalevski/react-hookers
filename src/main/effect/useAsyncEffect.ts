import { DependencyList, EffectCallback, useEffect, useRef } from 'react';
import { Awaitable, isPromiseLike } from 'parallel-universe';
import { isFunction } from '../utils';

export type AsyncEffectCallback = (signal: AbortSignal) => Awaitable<(() => void) | void>;

/**
 * Analogue of `React.useEffect` that can handle a `Promise` returned from the effect callback. Returned `Promise` may
 * resolve with a destructor / cleanup callback. An effect callback receives an `AbortSignal` that is aborted if effect
 * is called again before the previously returned `Promise` is resolved. Cleanup callbacks returned from the aborted
 * effects are ignored.
 *
 * @param effect The callback that is invoked if `deps` have changed. An effect may return a destructor / cleanup
 *     callback. The previous effect is cleaned up before executing the next effect.
 * @param deps The list of dependencies. If `undefined` then `effect` is called on every render.
 *
 * @see {@link https://reactjs.org/docs/hooks-reference.html#useeffect React.useEffect}
 * @see {@link useExecutor}
 */
export function useAsyncEffect(effect: AsyncEffectCallback, deps: DependencyList | undefined): void {
  const manager = (useRef<ReturnType<typeof createAsyncEffectManager>>().current = createAsyncEffectManager(effect));

  manager.__asyncEffect = effect;

  useEffect(manager.__effect, deps);
}

function createAsyncEffectManager(asyncEffect: AsyncEffectCallback) {
  let ac: AbortController | undefined;
  let destructor: (() => void) | void;

  const cleanup = (): void => {
    ac?.abort();
    ac = undefined;

    destructor?.();
    destructor = undefined;
  };

  const __effect: EffectCallback = () => {
    const currAc = new AbortController();
    const result = manager.__asyncEffect(currAc.signal);

    if (isPromiseLike(result)) {
      ac = currAc;

      result.then(result => {
        if (ac !== currAc) {
          return;
        }
        ac = undefined;
        destructor = isFunction(result) ? result : undefined;
      });
    } else {
      ac = undefined;
      destructor = isFunction(result) ? result : undefined;
    }

    return cleanup;
  };

  const manager = {
    __asyncEffect: asyncEffect,
    __effect,
  };

  return manager;
}
