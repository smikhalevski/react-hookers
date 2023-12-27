import type { EffectCallback } from 'react';
import type { AbortableCallback, Awaitable } from 'parallel-universe';
import type { ExecutorProtocol, ExecutorProvider } from './types';
import { useInsertionEffect } from '../useInsertionEffect';
import { useRerender } from '../useRerender';
import { useSemanticMemo } from '../useSemanticMemo';
import { assert, isFunction, noop } from '../utils';

/**
 * Returns the same manager instance on every render, except if the provider is changed.
 *
 * @internal
 * @param provider The provider that creates and destroys the executor.
 * @param initialValue The initial value, or `undefined` if executor shouldn't be populated.
 */
export function useExecutorManager(provider: ExecutorProvider, initialValue: unknown) {
  const rerender = useRerender();
  const manager = useSemanticMemo(() => createExecutorManager(provider, initialValue, rerender), [provider]);

  useInsertionEffect(manager.effect, [manager]);

  return manager;
}

function createExecutorManager(provider: ExecutorProvider, initialValue: unknown, rerender: () => void) {
  const executor = provider.createExecutor();

  let lastCallback = isFunction(initialValue) ? (initialValue as AbortableCallback<unknown>) : undefined;

  if (!executor.isSettled && !executor.isPending) {
    if (lastCallback !== undefined) {
      void executor.execute(lastCallback);
    } else if (initialValue !== undefined) {
      executor.resolve(initialValue);
    }
  }

  let doExecute: ExecutorProtocol['execute'] = () => new Promise(noop);
  let doClear: ExecutorProtocol['clear'] = noop;
  let doAbort: ExecutorProtocol['abort'] = noop;
  let doResolve: ExecutorProtocol['resolve'] = noop;
  let doReject: ExecutorProtocol['reject'] = noop;

  const effect: EffectCallback = () => {
    const unsubscribe = executor.subscribe(rerender);

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
      lastCallback = undefined;
      doExecute = () => new Promise(noop);
      doClear = doAbort = doResolve = doReject = noop;
      unsubscribe();
      provider.destroyExecutor(executor);
    };
  };

  return {
    executor,
    effect,

    getOrDefault(defaultValue: unknown) {
      return executor.getOrDefault(defaultValue);
    },
    execute(cb: AbortableCallback<any>) {
      assert(isFunction(cb), 'Expected a callback');

      lastCallback = cb;
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
    invalidate() {
      if (lastCallback !== undefined) {
        void doExecute(lastCallback);
      }
    },
  };
}
