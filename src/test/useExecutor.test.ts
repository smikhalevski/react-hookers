import { act, renderHook } from '@testing-library/react';
import { createElement, PropsWithChildren, StrictMode } from 'react';
import { ExecutorProvider, ExecutorProviderContext, useExecutor } from '../main';
import { Executor } from 'parallel-universe';

describe('useExecutor', () => {
  test('returns the same methods on every render', () => {
    const hook = renderHook(() => useExecutor(), { wrapper: StrictMode });
    const executor1 = hook.result.current;

    hook.rerender();

    const executor2 = hook.result.current;

    expect(executor1.getOrDefault).toBe(executor2.getOrDefault);
    expect(executor1.execute).toBe(executor2.execute);
    expect(executor1.clear).toBe(executor2.clear);
    expect(executor1.abort).toBe(executor2.abort);
    expect(executor1.resolve).toBe(executor2.resolve);
    expect(executor1.reject).toBe(executor2.reject);
  });

  test('creates a blank Executor instance', () => {
    const hook = renderHook(() => useExecutor(), { wrapper: StrictMode });
    const executor = hook.result.current;

    expect(executor.isPending).toBe(false);
    expect(executor.isFulfilled).toBe(false);
    expect(executor.isRejected).toBe(false);
    expect(executor.result).toBe(undefined);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(null);
  });

  test('creates an executor with non-function initial result', () => {
    const hook = renderHook(() => useExecutor(111), { wrapper: StrictMode });
    const executor = hook.result.current;

    expect(executor.isPending).toBe(false);
    expect(executor.isFulfilled).toBe(true);
    expect(executor.isRejected).toBe(false);
    expect(executor.result).toBe(111);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(null);
  });

  test('creates an executor with synchronous function initial result', () => {
    const hook = renderHook(() => useExecutor(() => 111), { wrapper: StrictMode });
    const executor = hook.result.current;

    expect(executor.isPending).toBe(false);
    expect(executor.isFulfilled).toBe(true);
    expect(executor.isRejected).toBe(false);
    expect(executor.result).toBe(111);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(null);
  });

  // test('creates an executor with asynchronous function initial result', async () => {
  //   const hookMock = jest.fn(() => useExecutor(() => Promise.resolve(111)));
  //   const hook = renderHook(hookMock, { wrapper: StrictMode });
  //   const executor = hook.result.current;
  //
  //   expect(executor.isPending).toBe(true);
  //   expect(executor.isFulfilled).toBe(false);
  //   expect(executor.isRejected).toBe(false);
  //   expect(executor.result).toBe(undefined);
  //   expect(executor.reason).toBe(undefined);
  //   expect(executor.promise).toBeInstanceOf(Promise);
  //
  //   await act(() => hook.result.current.promise);
  //
  //   expect(hookMock).toHaveBeenCalledTimes(4);
  //   expect(executor.isPending).toBe(false);
  //   expect(executor.isFulfilled).toBe(true);
  //   expect(executor.isRejected).toBe(false);
  //   expect(executor.result).toBe(111);
  //   expect(executor.reason).toBe(undefined);
  //   expect(executor.promise).toBe(null);
  // });

  test('re-renders after resolve', () => {
    const hookMock = jest.fn(() => useExecutor());
    const hook = renderHook(hookMock, { wrapper: StrictMode });

    act(() => void hook.result.current.resolve(111));

    expect(hookMock).toHaveBeenCalledTimes(4);
  });

  test('re-renders after reject', () => {
    const hookMock = jest.fn(() => useExecutor());
    const hook = renderHook(hookMock, { wrapper: StrictMode });

    act(() => void hook.result.current.reject(111));

    expect(hookMock).toHaveBeenCalledTimes(4);
  });
  //
  // test('re-renders after synchronous execute', () => {
  //   const hookMock = jest.fn(() => useExecutor());
  //   const hook = renderHook(hookMock, { wrapper: StrictMode });
  //
  //   act(() => void hook.result.current.execute(() => 111));
  //
  //   expect(hookMock).toHaveBeenCalledTimes(2);
  // });
  //
  // test('re-renders after asynchronous execute', async () => {
  //   const hookMock = jest.fn(() => useExecutor());
  //   const hook = renderHook(hookMock, { wrapper: StrictMode });
  //
  //   act(() => void hook.result.current.execute(() => Promise.resolve(111)));
  //
  //   await act(() => hook.result.current.promise);
  //
  //   expect(hookMock).toHaveBeenCalledTimes(3);
  // });

  test('uses provider to create an executor', async () => {
    const executorManager = new ExecutorProvider();
    executorManager.createExecutor = jest.fn(() => new Executor());

    const Context = (props: PropsWithChildren) =>
      createElement(ExecutorProviderContext.Provider, {
        value: executorManager,
        children: props.children,
      });

    renderHook(() => useExecutor(), { wrapper: Context });

    expect(executorManager.createExecutor).toHaveBeenCalledTimes(1);
  });
});
