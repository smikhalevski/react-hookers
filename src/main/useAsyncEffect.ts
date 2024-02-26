import { DependencyList, EffectCallback, useEffect, useRef } from 'react';

export type AsyncEffectCallback = (signal: AbortSignal) => PromiseLike<(() => void) | void>;

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
export function useAsyncEffect(effect: AsyncEffectCallback, deps?: DependencyList): void {
  const manager = (useRef<ReturnType<typeof createAsyncEffectManager>>().current = createAsyncEffectManager(effect));

  manager.asyncEffect = effect;

  useEffect(manager.effect, deps);
}

function createAsyncEffectManager(asyncEffect: AsyncEffectCallback) {
  let abortController: AbortController | undefined;
  let destructor: (() => void) | void;

  const cleanup = (): void => {
    if (abortController !== undefined) {
      abortController.abort();
      abortController = undefined;
    }
    if (destructor !== undefined) {
      destructor();
      destructor = undefined;
    }
  };

  const effect: EffectCallback = () => {
    const currAbortController = new AbortController();

    abortController = currAbortController;

    new Promise<(() => void) | void>(resolve => resolve(manager.asyncEffect(currAbortController.signal))).then(
      result => {
        if (abortController === currAbortController) {
          abortController = undefined;

          if (typeof result === 'function') {
            destructor = result;
          }
        }
      },
      reason => {
        if (abortController === currAbortController) {
          abortController = undefined;
        }
        throw reason;
      }
    );

    return cleanup;
  };

  const manager = {
    asyncEffect,
    effect,
  };

  return manager;
}
