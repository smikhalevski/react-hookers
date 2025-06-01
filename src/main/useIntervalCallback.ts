import { useFunctionEffect } from './useFunctionEffect.js';
import { useHandler } from './useHandler.js';
import { useInterval } from './useInterval.js';

/**
 * Invokes a callback periodically while the component is mounted.
 *
 * All functions that were scheduled with the same delay are invoked synchronously across all components that use this
 * hook.
 *
 * @param cb The callback to invoke.
 * @param ms The delay after which the callback must be invoked.
 * @param args Varargs that are passed as arguments to the callback.
 * @template A The callback arguments.
 * @see {@link useInterval}
 * @group Other
 */
export function useIntervalCallback<A extends any[]>(cb: (...args: A) => void, ms: number, ...args: A): void {
  const [schedule] = useInterval();

  useFunctionEffect(schedule, useHandler(cb), ms, ...args);
}
