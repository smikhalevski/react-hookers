import { DependencyList, EffectCallback, useEffect } from 'react';
import { useFunction } from './useFunction';

/**
 * The callback provided to {@link useAsyncEffect}.
 *
 * The returned cleanup callback is ignored if signal was aborted.
 *
 * @param signal The signal that is aborted when effect was discarded.
 * @returns The cleanup callback that is invoked when effect unmounted.
 * @group Other
 */
export type AsyncEffectCallback = (signal: AbortSignal) => PromiseLike<(() => void) | void>;

/**
 * Analogue of `React.useEffect` that can handle a {@link Promise} returned from the effect callback. Returned promise
 * may resolve with a destructor / cleanup callback. An effect callback receives an {@link AbortSignal} that is aborted
 * if effect is called again before the previously returned promise is resolved. Cleanup callbacks returned from
 * the aborted effects are ignored.
 *
 * @param fn The callback that is invoked if `deps` have changed. An effect may return a destructor/cleanup callback.
 * The previous effect is cleaned up before executing the next effect.
 * @param deps The list of dependencies. If `undefined` then `effect` is called on every render.
 * @group Other
 */
export function useAsyncEffect(fn: AsyncEffectCallback, deps?: DependencyList): void {
  const manager = useFunction(createAsyncEffectManager);

  manager.fn = fn;

  useEffect(manager.onDepsUpdated, deps);
}

interface AsyncEffectManager {
  fn: AsyncEffectCallback;
  onDepsUpdated: EffectCallback;
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

  const handleDepsUpdated: EffectCallback = () => {
    const lastAbortController = new AbortController();

    abortController = lastAbortController;

    new Promise<(() => void) | void>(resolve => resolve((0, manager.fn)(lastAbortController.signal))).then(
      value => {
        if (abortController === lastAbortController) {
          abortController = undefined;

          if (typeof value === 'function') {
            destructor = value;
          }
        }
      },
      reason => {
        if (abortController === lastAbortController) {
          abortController = undefined;
        }
        throw reason;
      }
    );

    return cleanup;
  };

  const manager: AsyncEffectManager = {
    fn: undefined!,
    onDepsUpdated: handleDepsUpdated,
  };

  return manager;
}
