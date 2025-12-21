import { useFunctionEffect } from './useFunctionEffect.js';
import { useHandler } from './useHandler.js';
import { useInterval } from './useInterval.js';

/**
 * Invokes a callback periodically while the component is mounted.
 *
 * All functions scheduled with the same delay are invoked synchronously across all components that use this hook.
 *
 * @example
 * const [count, setCount] = useState(0);
 *
 * // Increment the counter every second while the component is mounted
 * useIntervalCallback(
 *   step => setCount(prevCount => prevCount + step),
 *   1000, // Interval delay in milliseconds
 *   1     // Argument passed to the callback
 * );
 *
 * @param cb The callback to invoke.
 * @param ms The delay, in milliseconds, between invocations.
 * @param args Arguments passed to the callback.
 * @template A The callback argument types.
 * @see {@link useInterval}
 * @group Other
 */
export function useIntervalCallback<A extends any[]>(cb: (...args: A) => void, ms: number, ...args: A): void {
  const [schedule] = useInterval();

  useFunctionEffect(schedule, useHandler(cb), ms, ...args);
}
