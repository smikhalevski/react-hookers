import { AbortableCallback, AsyncResult, Awaitable, Executor } from 'parallel-universe';
import { EffectCallback, useContext } from 'react';
import { ExecutorProvider } from './ExecutorProvider';
import { ExecutorProviderContext } from './ExecutorProviderContext';
import { useInsertionEffect } from './useInsertionEffect';
import { useRerender } from './useRerender';
import { useSemanticMemo } from './useSemanticMemo';
import { isFunction, noop } from './utils';

/**
 * The symbol that holds the executor associated with the {@link ExecutorProtocol}.
 *
 * @internal
 */
export const EXECUTOR = Symbol('executor');

/**
 * Manages async callback execution process and provides ways to access execution results, abort or replace an
 * execution.
 *
 * @template T The result stored by the executor.
 */
export interface ExecutorProtocol<T = any> {
  /**
   * @internal
   */
  readonly [EXECUTOR]: Executor<T>;

  /**
   * `true` if result was fulfilled or rejected, or `false` otherwise.
   */
  readonly isSettled: boolean;

  /**
   * `true` if the result was fulfilled with a value, or `false` otherwise.
   */
  readonly isFulfilled: boolean;

  /**
   * `true` if the result was rejected with a reason, or `false` otherwise.
   */
  readonly isRejected: boolean;

  /**
   * `true` if an execution is currently pending, or `false` otherwise.
   */
  readonly isPending: boolean;

  /**
   * The result value or `undefined` if failed.
   */
  readonly result: T | undefined;

  /**
   * The reason of failure.
   */
  readonly reason: any;

  /**
   * The promise of the execution result, or `null` if execution isn't pending.
   */
  readonly promise: Promise<AsyncResult<T>> | null;

  /**
   * Returns a {@link result}, or the default value if the result isn't available.
   *
   * @param defaultValue The default value.
   */
  getOrDefault(defaultValue: T): T;

  /**
   * Instantly aborts pending execution (if any), marks executor as pending and invokes the callback.
   *
   * If other execution was started before the promise returned by the callback is fulfilled then the signal is aborted
   * and the returned result is ignored.
   *
   * @param cb The callback that returns the new result for the executor to store.
   * @returns The promise that is resolved with the result of the callback execution.
   */
  execute(cb: AbortableCallback<T>): Promise<AsyncResult<T>>;

  /**
   * Clears available results and doesn't affect the pending execution.
   */
  clear(): void;

  /**
   * Instantly aborts pending execution and preserves available results. Value (or error) returned from pending
   * callback is ignored. The signal passed to the executed callback is aborted.
   */
  abort(): void;

  /**
   * Aborts pending execution and fulfills it with the given result.
   *
   * @param result The result that should be stored in an executor.
   */
  resolve(result: PromiseLike<T> | T): void;

  /**
   * Instantly aborts pending execution and rejects with the given reason.
   *
   * @param reason The reason of failure that should be stored in an executor.
   */
  reject(reason: unknown): void;
}

/**
 * Creates a new {@link https://github.com/smikhalevski/parallel-universe#executor Executor} and re-renders a
 * component when its state is changed.
 *
 * @param initialValue The initial value, a promise that resolves with the initial value, or a callback that returns an
 * initial value.
 * @template T The result stored by the executor.
 * @see {@link ExecutorProviderContext}
 * @see {@link useExecution}
 */
export function useExecutor<T>(initialValue?: AbortableCallback<T> | PromiseLike<T> | T): ExecutorProtocol<T> {
  const provider = useContext(ExecutorProviderContext);
  const rerender = useRerender();
  const manager = useSemanticMemo(() => createExecutorManager(provider, initialValue, rerender), [provider]);
  const executor = manager.executor;

  useInsertionEffect(manager.effect, [manager]);

  return {
    [EXECUTOR]: executor,
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

function createExecutorManager(provider: ExecutorProvider, initialValue: unknown, rerender: () => void) {
  const executor = provider.createExecutor();

  if (isFunction(initialValue)) {
    executor.execute(initialValue as AbortableCallback<unknown>);
  } else if (initialValue !== undefined) {
    executor.resolve(initialValue);
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
  };
}
