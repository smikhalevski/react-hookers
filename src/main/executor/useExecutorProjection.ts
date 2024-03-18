import { AbortableCallback, AbortablePromise, Awaitable } from 'parallel-universe';
import { Executor } from 'parallel-universe';
import { EffectCallback } from 'react';
import { useInsertionEffect } from '../useInsertionEffect';
import { useRerender } from '../useRerender';
import { useSemanticMemo } from '../useSemanticMemo';
import { isFunction, noop } from '../utils';
import { ExecutorOptions, ExecutorProtocol } from './types';

/**
 * Returns the same projection instance on every render, except if the executor is changed. All projection methods
 * become no-op after the hook is unmounted.
 *
 * @internal
 * @param executor The executor for which projection are maintained.
 * @param initialValue The initial value, a callback that returns the initial value, a promise that resolves with the
 * initial value, or `undefined` if executor shouldn't be populated. Initial value is used only if an executor isn't
 * settled already or pending.
 * @param options Executor options.
 */
export function useExecutorProjection(executor: Executor, initialValue: unknown, options?: ExecutorOptions) {
  const rerender = useRerender();
  const manager = useSemanticMemo(
    () => createExecutorProjectionManager(executor, initialValue, options, rerender),
    [executor]
  );

  useInsertionEffect(manager.effect, [manager]);

  return manager.projection;
}

function createExecutorProjectionManager(
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

  const isClientOnly = options?.clientOnly;

  const effect: EffectCallback = () => {
    const unsubscribe = executor.subscribe(rerender);

    if (isClientOnly) {
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

  if (!isClientOnly) {
    initExecutor(executor, initialValue);
  }

  return {
    effect,

    projection: {
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
