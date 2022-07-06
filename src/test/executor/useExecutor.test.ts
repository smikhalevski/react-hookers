import { act, renderHook } from '@testing-library/react';
import { ExecutorProvider, ExecutorProviderContext, useExecutor } from '../../main';
import { Executor } from 'parallel-universe';
import { createElement, FunctionComponent } from 'react';

describe('useExecutor', () => {
  test('returns the same Executor on every render', () => {
    const hook = renderHook(() => useExecutor());
    const executor1 = hook.result.current;

    hook.rerender();
    const executor2 = hook.result.current;

    expect(executor1).toBe(executor2);
  });

  test('creates a blank Executor instance', () => {
    const hook = renderHook(() => useExecutor());
    const executor = hook.result.current;

    expect(executor).toBeInstanceOf(Executor);
    expect(executor.pending).toBe(false);
    expect(executor.resolved).toBe(false);
    expect(executor.rejected).toBe(false);
    expect(executor.result).toBe(undefined);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(undefined);
  });

  test('creates an executor with non-function initial result', () => {
    const hook = renderHook(() => useExecutor(123));
    const executor = hook.result.current;

    expect(executor.pending).toBe(false);
    expect(executor.resolved).toBe(true);
    expect(executor.rejected).toBe(false);
    expect(executor.result).toBe(123);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(undefined);
  });

  test('creates an executor with synchronous function initial result', () => {
    const hook = renderHook(() => useExecutor(() => 123));
    const executor = hook.result.current;

    expect(executor.pending).toBe(false);
    expect(executor.resolved).toBe(true);
    expect(executor.rejected).toBe(false);
    expect(executor.result).toBe(123);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(undefined);
  });

  test('creates an executor with asynchronous function initial result', async () => {
    const hookMock = jest.fn(() => useExecutor(() => Promise.resolve(123)));
    const hook = renderHook(hookMock);
    const executor = hook.result.current;

    expect(executor.pending).toBe(true);
    expect(executor.resolved).toBe(false);
    expect(executor.rejected).toBe(false);
    expect(executor.result).toBe(undefined);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBeInstanceOf(Promise);

    await act(async () => await hook.result.current.promise);

    expect(hookMock).toHaveBeenCalledTimes(2);
    expect(executor.pending).toBe(false);
    expect(executor.resolved).toBe(true);
    expect(executor.rejected).toBe(false);
    expect(executor.result).toBe(123);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(undefined);
  });

  test('re-renders after resolve', () => {
    const hookMock = jest.fn(() => useExecutor());
    const hook = renderHook(hookMock);

    act(() => void hook.result.current.resolve(123));

    expect(hookMock).toHaveBeenCalledTimes(2);
  });

  test('re-renders after reject', () => {
    const hookMock = jest.fn(() => useExecutor());
    const hook = renderHook(hookMock);

    act(() => void hook.result.current.reject(123));

    expect(hookMock).toHaveBeenCalledTimes(2);
  });

  test('re-renders after synchronous execute', () => {
    const hookMock = jest.fn(() => useExecutor());
    const hook = renderHook(hookMock);

    act(() => void hook.result.current.execute(() => 123));

    expect(hookMock).toHaveBeenCalledTimes(2);
  });

  test('re-renders after asynchronous execute', async () => {
    const hookMock = jest.fn(() => useExecutor());
    const hook = renderHook(hookMock);

    act(() => void hook.result.current.execute(() => Promise.resolve(123)));

    await act(async () => await hook.result.current.promise);

    expect(hookMock).toHaveBeenCalledTimes(3);
  });

  test('uses provider to create an executor', async () => {
    const executorManager = new ExecutorProvider();
    executorManager.createExecutor = jest.fn();

    const Context: FunctionComponent = props =>
      createElement(ExecutorProviderContext.Provider, {
        value: executorManager,
        children: props.children,
      });

    renderHook(() => useExecutor(), { wrapper: Context });

    expect(executorManager.createExecutor).toHaveBeenCalledTimes(1);
  });

  test('uses provider to dispose an executor', async () => {
    const executorManager = new ExecutorProvider();
    executorManager.disposeExecutor = jest.fn();

    const Context: FunctionComponent = ({ children }) =>
      createElement(ExecutorProviderContext.Provider, {
        value: executorManager,
        children,
      });

    const hook = renderHook(() => useExecutor(), { wrapper: Context });
    const executor = hook.result.current;

    expect(executor).toBeInstanceOf(Object);

    hook.unmount();

    expect(executorManager.disposeExecutor).toHaveBeenCalledTimes(1);
    expect(executorManager.disposeExecutor).toHaveBeenNthCalledWith(1, executor);
  });
});
