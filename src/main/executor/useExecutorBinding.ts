import { AbortableCallback, AbortablePromise, Awaitable, Executor } from 'parallel-universe';
import { EffectCallback, useEffect } from 'react';
import { useRerender } from '../useRerender';
import { useSemanticMemo } from '../useSemanticMemo';
import { isFunction, noop } from '../utils';
import { ExecutorOptions, ExecutorProtocol } from './types';

/**
 * Returns a bag of methods that are bound the executor. Returns the same instance on every render, except if the
 * executor is changed. All bound methods become no-op after the hook is unmounted.
 *
 * @internal
 * @param executor The executor for which projection are maintained.
 * @param initialValue The initial value, a callback that returns the initial value, a promise that resolves with the
 * initial value, or `undefined` if executor shouldn't be populated. Initial value is used only if an executor isn't
 * settled already or pending.
 * @param options Executor options.
 */
export function useExecutorBinding(executor: Executor, initialValue: unknown, options?: ExecutorOptions) {
  const rerender = useRerender();
  const manager = useSemanticMemo(
    () => createExecutorBindingManager(executor, initialValue, options, rerender),
    [executor]
  );

  useEffect(manager.effect, [manager]);

  return manager.binding;
}

function createExecutorBindingManager(
  executor: Executor,
  initialValue: unknown,
  options: ExecutorOptions | undefined,
  rerender: () => void
) {
  let doExecute: ExecutorProtocol['execute'] = () => new AbortablePromise(noop);
  let doClear: ExecutorProtocol['clear'] = noop;
  let doAbort: ExecutorProtocol['abort'] = noop;
  let doResolve: ExecutorProtocol['resolve'] = noop;
  let doReject: ExecutorProtocol['reject'] = noop;

  const isClient = options !== undefined && options.runsOn !== 'server';

  const effect: EffectCallback = () => {
    const unsubscribe = executor.subscribe(rerender);

    if (isClient) {
      initExecutor(executor, initialValue);
    }

    doExecute = cb => executor.execute(cb);

    doClear = () => {
      executor.clear();
    };
    doAbort = () => {
      executor.abort();
    };
    doResolve = result => {
      executor.resolve(result);
    };
    doReject = reason => {
      executor.reject(reason);
    };

    return () => {
      doExecute = () => new AbortablePromise(noop);
      doClear = doAbort = doResolve = doReject = noop;
      unsubscribe();
    };
  };

  if (!isClient) {
    initExecutor(executor, initialValue);
  }

  return {
    effect,

    binding: {
      getOrDefault(defaultValue: unknown) {
        return executor.getOrDefault(defaultValue);
      },
      execute(cb: AbortableCallback<any>) {
        return doExecute(cb);
      },
      clear() {
        doClear();
      },
      abort() {
        doAbort();
      },
      resolve(result: Awaitable<unknown> | undefined) {
        doResolve(result);
      },
      reject(reason: unknown) {
        doReject(reason);
      },
    },
  };
}

function initExecutor(executor: Executor, initialValue: unknown) {
  if (executor.isSettled || executor.isPending) {
    return;
  }
  if (isFunction(initialValue)) {
    void executor.execute(initialValue as AbortableCallback<unknown>);
    return;
  }
  if (initialValue !== undefined) {
    executor.resolve(initialValue);
  }
}
