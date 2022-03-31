import {Executor} from 'parallel-universe';
import {useRef} from 'react';
import {useExecutor} from '../executor';

export type PreconditionApply = <A extends any[]>(cb: (...args: A) => unknown, captureArgs?: (...args: A) => A | void) => (...args: A) => void

export type PreconditionProtocol = [withPrecondition: PreconditionApply, pending: boolean, abort: () => void];

export type PreconditionCheck = (signal: AbortSignal) => unknown;

export type PreconditionFallback = (replay: () => void) => void;

/**
 * Extract shared conditional logic from event handlers and callbacks.
 *
 * @param check The condition that should be met.
 * @param fallback The callback that is invoked if condition wasn't met.
 */
export function usePrecondition(check: PreconditionCheck, fallback?: PreconditionFallback): PreconditionProtocol {
  const executor = useExecutor();
  const manager = useRef<ReturnType<typeof createPreconditionManager>>().current ||= createPreconditionManager();

  manager.__applyOptions(executor, check, fallback);

  return manager.__protocol;
}

export function createPreconditionManager() {

  let executor: Executor;
  let condition: PreconditionCheck;
  let fallback: PreconditionFallback | undefined;
  let unsubscribe: (() => void) | undefined;

  const withPrecondition: PreconditionApply = (cb, captureArgs) => (...args) => {
    const capturedArgs = captureArgs?.(...args) || args;

    executor.execute((signal) => Promise.resolve(condition(signal)).then((ok) => {
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

  const abort = (): void => {
    executor.abort();
  };

  const __applyOptions = (nextExecutor: Executor, nextCondition: PreconditionCheck, nextFallback: PreconditionFallback | undefined): void => {

    if (executor !== nextExecutor) {
      unsubscribe?.();
      unsubscribe = nextExecutor.subscribe(() => {
        __protocol[1] = nextExecutor.pending;
      });
    }

    executor = nextExecutor;
    condition = nextCondition;
    fallback = nextFallback;
  };

  const __protocol: PreconditionProtocol = [withPrecondition, false, abort];

  return {
    __applyOptions,
    __protocol,
  };
}
