import { EffectCallback, useContext, useEffect } from 'react';
import { ExecutorProvider, ExecutorProviderContext, useRerender, useSemanticMemo } from './index';

export type PreconditionProtocol = [
  afterCheck: <A extends any[]>(
    cb: (...args: A) => unknown,
    captureArgs?: (...args: A) => A | void
  ) => (...args: A) => void,
  pending: boolean,
  abort: () => void,
];

type Check = (signal: AbortSignal) => unknown;

type Fallback = (replay: () => void) => void;

/**
 * Extract shared conditional logic from event handlers and callbacks.
 *
 * @param check The callback that should return a truthy value to indicate that the precondition is met. If a promise is
 * returned, then it is first awaited and the resolved value is used as an indication that the precondition is met.
 * @param fallback The callback that is invoked if condition wasn't met.
 */
export function usePrecondition(
  check: (signal: AbortSignal) => unknown,
  fallback?: (replay: () => void) => void
): Readonly<PreconditionProtocol> {
  const provider = useContext(ExecutorProviderContext);
  const rerender = useRerender();

  const manager = useSemanticMemo(() => createPreconditionManager(provider, rerender), [provider]);

  manager.applyOptions(check, fallback);

  useEffect(manager.effect, [manager]);

  return manager.protocol;
}

function createPreconditionManager(provider: ExecutorProvider, rerender: () => void) {
  const executor = provider.createExecutor();

  let check: Check;
  let fallback: Fallback | undefined;

  const afterCheck: PreconditionProtocol[0] =
    (cb, captureArgs) =>
    (...args) => {
      const capturedArgs = captureArgs?.(...args) || args;

      executor.execute(signal =>
        Promise.resolve(check(signal)).then(ok => {
          if (signal.aborted) {
            return;
          }
          if (ok) {
            cb(...capturedArgs);
            return;
          }
          fallback?.(
            afterCheck(() => {
              cb(...capturedArgs);
            })
          );
        })
      );
    };

  const applyOptions = (nextCheck: Check, nextFallback: Fallback | undefined): void => {
    check = nextCheck;
    fallback = nextFallback;
  };

  const effect: EffectCallback = () => {
    return executor.subscribe(() => {
      protocol[1] = executor.isPending;
      rerender();
    });
  };

  const protocol: PreconditionProtocol = [afterCheck, false, executor.abort.bind(executor)];

  return {
    applyOptions,
    effect,
    protocol,
  };
}
