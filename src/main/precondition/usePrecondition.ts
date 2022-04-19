import {EffectCallback, useContext, useEffect} from 'react';
import {ExecutorProvider, ExecutorProviderContext} from '../executor';
import {useSemanticMemo} from '../memo';
import {useRerender} from '../render';

export type WithPrecondition = <A extends any[]>(cb: (...args: A) => unknown, captureArgs?: (...args: A) => A | void) => (...args: A) => void

export type PreconditionProtocol = [withPrecondition: WithPrecondition, pending: boolean, abort: () => void];

type Check = (signal: AbortSignal) => unknown;

type Fallback = (replay: () => void) => void;

/**
 * Extract shared conditional logic from event handlers and callbacks.
 *
 * @param check The callback that should return a truthy value to indicate that the precondition is met. If a promise is
 * returned, then it is first awaited and the resolved value is used as an indication that the precondition is met.
 * @param fallback The callback that is invoked if condition wasn't met.
 */
export function usePrecondition(check: (signal: AbortSignal) => unknown, fallback?: (replay: () => void) => void): PreconditionProtocol {
  const provider = useContext(ExecutorProviderContext);
  const rerender = useRerender();

  const manager = useSemanticMemo(() => createPreconditionManager(provider, rerender), [provider]);

  manager.__applyOptions(check, fallback);

  useEffect(manager.__effect, [manager]);

  return manager.__protocol;
}

function createPreconditionManager(provider: ExecutorProvider, rerender: () => void) {

  const executor = provider.createExecutor();

  let check: Check;
  let fallback: Fallback | undefined;

  const withPrecondition: WithPrecondition = (cb, captureArgs) => (...args) => {
    const capturedArgs = captureArgs?.(...args) || args;

    executor.execute((signal) => Promise.resolve(check(signal)).then((ok) => {
      if (signal.aborted) {
        return;
      }
      if (ok) {
        cb(...capturedArgs);
        return;
      }
      fallback?.(withPrecondition(() => {
        cb(...capturedArgs);
      }));
    }));
  };

  const __applyOptions = (nextCheck: Check, nextFallback: Fallback | undefined): void => {
    check = nextCheck;
    fallback = nextFallback;
  };

  const __effect: EffectCallback = () => {

    const unsubscribe = executor.subscribe(() => {
      __protocol[1] = executor.pending;
      rerender();
    });

    return () => {
      unsubscribe();
      provider.disposeExecutor(executor);
    };
  };

  const __protocol: PreconditionProtocol = [withPrecondition, false, executor.abort.bind(executor)];

  return {
    __applyOptions,
    __effect,
    __protocol,
  };
}
