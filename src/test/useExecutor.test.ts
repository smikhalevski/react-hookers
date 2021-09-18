import {act, renderHook} from '@testing-library/react-hooks';
import {IExecutorProvider} from '../main/ExecutorCache';
import {ExecutorProviderContext, useExecutor} from '../main/useExecutor';
import AbortController from 'node-abort-controller';
import {Executor} from '../main/Executor';
import {createElement, FunctionComponent} from 'react';

global.AbortController = AbortController;

describe('useExecutor', () => {

  test('creates a blank executor', () => {
    const hook = renderHook(() => useExecutor());

    expect(hook.result.current.disposed).toBe(false);
    expect(hook.result.current.pending).toBe(false);
    expect(hook.result.current.resolved).toBe(false);
    expect(hook.result.current.rejected).toBe(false);
    expect(hook.result.current.result).toBe(undefined);
    expect(hook.result.current.reason).toBe(undefined);
    expect(hook.result.current.promise).toBe(undefined);
  });

  test('creates an executor with non-function initial result', () => {
    const hook = renderHook(() => useExecutor(123));

    expect(hook.result.current.disposed).toBe(false);
    expect(hook.result.current.pending).toBe(false);
    expect(hook.result.current.resolved).toBe(true);
    expect(hook.result.current.rejected).toBe(false);
    expect(hook.result.current.result).toBe(123);
    expect(hook.result.current.reason).toBe(undefined);
    expect(hook.result.current.promise).toBe(undefined);
  });

  test('creates an executor with synchronous function initial result', () => {
    const hook = renderHook(() => useExecutor(() => 123));

    expect(hook.result.current.disposed).toBe(false);
    expect(hook.result.current.pending).toBe(false);
    expect(hook.result.current.resolved).toBe(true);
    expect(hook.result.current.rejected).toBe(false);
    expect(hook.result.current.result).toBe(123);
    expect(hook.result.current.reason).toBe(undefined);
    expect(hook.result.current.promise).toBe(undefined);
  });

  test('creates an executor with asynchronous function initial result', async () => {
    const hookMock = jest.fn(() => useExecutor(() => Promise.resolve(123)));
    const hook = renderHook(hookMock);

    expect(hook.result.current.disposed).toBe(false);
    expect(hook.result.current.pending).toBe(true);
    expect(hook.result.current.resolved).toBe(false);
    expect(hook.result.current.rejected).toBe(false);
    expect(hook.result.current.result).toBe(undefined);
    expect(hook.result.current.reason).toBe(undefined);
    expect(hook.result.current.promise).toBeInstanceOf(Promise);

    await act(async () => await hook.result.current.promise);

    expect(hookMock).toHaveBeenCalledTimes(3); // last re-render is forced
    expect(hook.result.current.disposed).toBe(false);
    expect(hook.result.current.pending).toBe(false);
    expect(hook.result.current.resolved).toBe(true);
    expect(hook.result.current.rejected).toBe(false);
    expect(hook.result.current.result).toBe(123);
    expect(hook.result.current.reason).toBe(undefined);
    expect(hook.result.current.promise).toBe(undefined);
  });

  test('disposes executor after unmount', () => {
    const hook = renderHook(() => useExecutor());
    hook.unmount();

    expect(hook.result.current.disposed).toBe(true);
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
    const executorProvider: IExecutorProvider = {
      createExecutor: jest.fn(),
      disposeExecutor: () => undefined,
    };

    const Context: FunctionComponent = ({children}) => createElement(ExecutorProviderContext.Provider, {
      value: executorProvider,
      children,
    });

    renderHook(() => useExecutor(), {wrapper: Context});

    expect(executorProvider.createExecutor).toHaveBeenCalledTimes(1);
    expect(executorProvider.createExecutor).toHaveBeenNthCalledWith(1, expect.any(Function));
  });

  test('uses provider to dispose an executor', async () => {
    const executorProvider: IExecutorProvider = {
      createExecutor: (listener) => new Executor<any>(listener),
      disposeExecutor: jest.fn(),
    };

    const Context: FunctionComponent = ({children}) => createElement(ExecutorProviderContext.Provider, {
      value: executorProvider,
      children,
    });

    const hook = renderHook(() => useExecutor(), {wrapper: Context});
    const executor = hook.result.current;

    expect(executor).toBeInstanceOf(Object);

    hook.unmount();

    expect(executorProvider.disposeExecutor).toHaveBeenCalledTimes(1);
    expect(executorProvider.disposeExecutor).toHaveBeenNthCalledWith(1, executor);

    // Hooks delegates disposal to the provider
    expect(hook.result.current.disposed).toBe(false);
  });
});
