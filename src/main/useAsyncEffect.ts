import { DependencyList, EffectCallback, useEffect, useRef } from 'react';
import { Awaitable, isPromiseLike } from 'parallel-universe';
import { isFunction } from './utils';

export type AsyncEffectCallback = (signal: AbortSignal) => Awaitable<(() => void) | void>;

/**
 * Analogue of `React.useEffect` that can handle a `Promise` returned from the effect callback. Returned `Promise` may
 * resolve with a destructor / cleanup callback. An effect callback receives an `AbortSignal` that is aborted if effect
 * is called again before the previously returned `Promise` is resolved. Cleanup callbacks returned from the aborted
 * effects are ignored.
 *
 * @param effect The callback that is invoked if `deps` have changed. An effect may return a destructor / cleanup
 * callback. The previous effect is cleaned up before executing the next effect.
 * @param deps The list of dependencies. If `undefined` then `effect` is called on every render.
 *
 * @see {@link useExecutor}
 */
export function useAsyncEffect(effect: AsyncEffectCallback, deps: DependencyList | undefined): void {
  const manager = (useRef<ReturnType<typeof createAsyncEffectManager>>().current = createAsyncEffectManager(effect));

  manager.asyncEffect = effect;

  useEffect(manager.effect, deps);
}

function createAsyncEffectManager(asyncEffect: AsyncEffectCallback) {
  let abortController: AbortController | undefined;
  let destructor: (() => void) | void;

  const cleanup = (): void => {
    abortController?.abort();
    abortController = undefined;

    destructor?.();
    destructor = undefined;
  };

  const effect: EffectCallback = () => {
    const currAbortController = new AbortController();
    const result = manager.asyncEffect(currAbortController.signal);

    if (isPromiseLike(result)) {
      abortController = currAbortController;

      result.then(result => {
        if (abortController !== currAbortController) {
          return;
        }
        abortController = undefined;
        destructor = isFunction(result) ? result : undefined;
      });
    } else {
      abortController = undefined;
      destructor = isFunction(result) ? result : undefined;
    }

    return cleanup;
  };

  const manager = {
    asyncEffect,
    effect,
  };

  return manager;
}
