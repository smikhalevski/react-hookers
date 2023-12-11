import { ExecutorProviderContext } from './ExecutorProviderContext';
import { AbortableCallback, AsyncResult, Awaitable, Executor } from 'parallel-universe';
import { EffectCallback, useContext } from 'react';
import { useInsertionEffect } from './useInsertionEffect';
import { useSemanticMemo } from './useSemanticMemo';
import { useRerender } from './useRerender';
import { isFunction, noop } from './utils';

export interface ExecutorProtocol<T = any> {
  readonly isFulfilled: boolean;
  readonly isRejected: boolean;
  readonly isSettled: boolean;
  readonly isPending: boolean;
  readonly result: T | undefined;
  readonly reason: any;
  readonly promise: Promise<AsyncResult<T>> | null;

  getOrDefault(defaultValue: T): T;

  execute(cb: AbortableCallback<T>): Promise<AsyncResult<T>>;

  clear(): void;

  abort(): void;

  resolve(result: PromiseLike<T> | T): void;

  reject(reason: unknown): void;
}

/**
 * Creates a new {@link https://github.com/smikhalevski/parallel-universe#executor Executor} and re-renders a
 * component when its state is changed.
 *
 * @see {@link ExecutorProviderContext}
 * @see {@link useExecution}
 */
export function useExecutor<T>(initialValue?: (() => PromiseLike<T> | T) | PromiseLike<T> | T): ExecutorProtocol<T> {
  const provider = useContext(ExecutorProviderContext);
  const rerender = useRerender();
  const manager = useSemanticMemo(() => createExecutorManager(provider, initialValue, rerender), [provider]);
  const executor = manager.executor;

  useInsertionEffect(manager.effect, [manager]);

  return {
    isFulfilled: executor.isFulfilled,
    isRejected: executor.isRejected,
    isSettled: executor.isSettled,
    isPending: executor.isPending,
    result: executor.result,
    reason: executor.reason,
    promise: executor.promise,
    getOrDefault: manager.getOrDefault,
    execute: manager.execute,
    clear: manager.clear,
    abort: manager.abort,
    resolve: manager.resolve,
    reject: manager.reject,
  };
}

function createExecutorManager(provider: { createExecutor(): Executor }, initialValue: unknown, rerender: () => void) {
  const executor = provider.createExecutor();

  if (isFunction(initialValue)) {
    executor.resolve(initialValue());
  } else if (initialValue !== undefined) {
    executor.resolve(initialValue);
  }

  let _execute: ExecutorProtocol['execute'] = () => new Promise(noop);
  let _clear: ExecutorProtocol['clear'] = noop;
  let _abort: ExecutorProtocol['abort'] = noop;
  let _resolve: ExecutorProtocol['resolve'] = noop;
  let _reject: ExecutorProtocol['reject'] = noop;

  const effect: EffectCallback = () => {
    const unsubscribe = executor.subscribe(rerender);

    _execute = cb => executor.execute(cb);

    _clear = () => {
      executor.clear();
    };
    _abort = () => {
      executor.abort();
    };
    _resolve = result => {
      executor.resolve(result);
    };
    _reject = reason => {
      executor.reject(reason);
    };

    return () => {
      _execute = () => new Promise(noop);
      _clear = _abort = _resolve = _reject = noop;
      unsubscribe();
      executor.abort();
    };
  };

  return {
    executor,
    effect,

    getOrDefault(defaultValue: unknown) {
      return executor.getOrDefault(defaultValue);
    },
    execute(cb: AbortableCallback<any>) {
      return _execute(cb);
    },
    clear() {
      _clear();
    },
    abort() {
      _abort();
    },
    resolve(result: Awaitable<unknown> | undefined) {
      _resolve(result);
    },
    reject(reason: unknown) {
      _reject(reason);
    },
  };
}
