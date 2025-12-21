import { DependencyList, EffectCallback, useEffect } from 'react';
import { useFunctionOnce } from './useFunctionOnce.js';

/**
 * The callback provided to {@link useAsyncEffect}.
 *
 * The returned cleanup callback is ignored if the signal was aborted.
 *
 * @param signal The signal that is aborted when the effect is discarded.
 * @returns A cleanup callback that is invoked when the effect is unmounted.
 * @group Other
 */
export type AsyncEffectCallback = (signal: AbortSignal) => PromiseLike<(() => void) | void>;

/**
 * An analogue of `React.useEffect` that supports a {@link Promise} returned from the effect callback.
 *
 * The returned promise may resolve to a destructor/cleanup callback. The effect callback receives an
 * {@link AbortSignal} that is aborted if the effect is re-run before the previously returned promise resolves.
 * Cleanup callbacks returned from aborted effects are ignored.
 *
 * @example
 * useAsyncEffect(
 *   async (signal) => {
 *     doSomething(a, b);
 *
 *     return () => {
 *       cleanup();
 *     };
 *   },
 *   [a, b],
 * );
 *
 * @param fn The callback that is invoked when `deps` change. The effect may return a destructor/cleanup callback.
 * The previous effect is cleaned up before executing the next one.
 * @param deps The list of dependencies. If `undefined`, the effect is executed on every render.
 * @group Other
 */
export function useAsyncEffect(fn: AsyncEffectCallback, deps?: DependencyList): void {
  const manager = useFunctionOnce(createAsyncEffectManager);

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
