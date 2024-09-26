import { DependencyList, EffectCallback, useEffect } from 'react';
import { useFunction } from './useFunction';

/**
 * The callback provided to {@link useAsyncEffect}.
 *
 * The returned cleanup callback is ignored if signal was aborted.
 *
 * @param signal The signal that is aborted when effect was discarded.
 * @returns The cleanup callback that is invoked when effect unmounted.
 */
export type AsyncEffectCallback = (signal: AbortSignal) => PromiseLike<(() => void) | void>;

/**
 * Analogue of `React.useEffect` that can handle a {@link Promise} returned from the effect callback. Returned promise
 * may resolve with a destructor / cleanup callback. An effect callback receives an {@link AbortSignal} that is aborted
 * if effect is called again before the previously returned promise is resolved. Cleanup callbacks returned from
 * the aborted effects are ignored.
 *
 * @param effect The callback that is invoked if `deps` have changed. An effect may return a destructor / cleanup
 * callback. The previous effect is cleaned up before executing the next effect.
 * @param deps The list of dependencies. If `undefined` then `effect` is called on every render.
 */
export function useAsyncEffect(effect: AsyncEffectCallback, deps?: DependencyList): void {
  const manager = useFunction(createAsyncEffectManager);

  manager.effect = effect;

  useEffect(manager.onDepsChanged, deps);
}

interface AsyncEffectManager {
  effect: AsyncEffectCallback;
  onDepsChanged: EffectCallback;
}

function createAsyncEffectManager(): AsyncEffectManager {
  let abortController: AbortController | undefined;
  let destructor: (() => void) | void;

  const cleanup = () => {
    if (abortController !== undefined) {
      abortController.abort();
      abortController = undefined;
    }

    if (destructor !== undefined) {
      destructor();
      destructor = undefined;
    }
  };

  const handleDepsChanged: EffectCallback = () => {
    const currAbortController = new AbortController();

    abortController = currAbortController;

    new Promise<(() => void) | void>(resolve => resolve((0, manager.effect)(currAbortController.signal))).then(
      value => {
        if (abortController === currAbortController) {
          abortController = undefined;

          if (typeof value === 'function') {
            destructor = value;
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

  const manager: AsyncEffectManager = {
    effect: undefined!,
    onDepsChanged: handleDepsChanged,
  };

  return manager;
}
