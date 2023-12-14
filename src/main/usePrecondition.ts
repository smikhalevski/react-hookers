import { EffectCallback, useContext, useEffect } from 'react';
import { ExecutorProviderContext } from './ExecutorProviderContext';
import { useRerender } from './useRerender';
import { useSemanticMemo } from './useSemanticMemo';
import { ExecutorProvider } from './ExecutorProvider';

export type PreconditionProtocol = [
  protect: <A extends any[]>(
    cb: (...args: A) => unknown,
    captureArgs?: (...args: A) => A | void
  ) => (...args: A) => void,
  pending: boolean,
  abort: () => void,
];

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

  manager.check = check;
  manager.fallback = fallback;

  useEffect(manager.effect, [manager]);

  return [manager.protect, manager.isPending, manager.abort];
}

function createPreconditionManager(provider: ExecutorProvider, rerender: () => void) {
  const executor = provider.createExecutor();

  const protect: PreconditionProtocol[0] =
    (cb, captureArgs) =>
    (...args) => {
      const { check, fallback } = manager;
      const capturedArgs = captureArgs?.(...args) || args;

      executor.execute(signal => {
        return Promise.resolve(check ? check(signal) : true).then(ok => {
          if (signal.aborted) {
            return;
          }
          if (ok) {
            cb(...capturedArgs);
            return;
          }
          fallback?.(
            protect(() => {
              cb(...capturedArgs);
            })
          );
        });
      });
    };

  const effect: EffectCallback = () => {
    const unsubscribe = executor.subscribe(() => {
      manager.isPending = executor.isPending;
      rerender();
    });

    return () => {
      unsubscribe();
      executor.abort();
    };
  };

  const manager = {
    check: undefined as Parameters<typeof usePrecondition>[0] | undefined,
    fallback: undefined as Parameters<typeof usePrecondition>[1],
    effect,
    protect,
    isPending: false,
    abort: executor.abort.bind(executor),
  };

  return manager;
}
