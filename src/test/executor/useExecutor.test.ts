import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { useExecutor } from '../../main';

describe('useExecutor', () => {
  test('returns the same methods on every render', () => {
    const hook = renderHook(() => useExecutor('xxx'), { wrapper: StrictMode });
    const executor1 = hook.result.current;

    hook.rerender();

    const executor2 = hook.result.current;

    expect(executor1).not.toBe(executor2);
    expect(executor1.getOrDefault).toBe(executor2.getOrDefault);
    expect(executor1.execute).toBe(executor2.execute);
    expect(executor1.clear).toBe(executor2.clear);
    expect(executor1.abort).toBe(executor2.abort);
    expect(executor1.resolve).toBe(executor2.resolve);
    expect(executor1.reject).toBe(executor2.reject);
  });

  test('creates a blank Executor instance', () => {
    const hook = renderHook(() => useExecutor('xxx'), { wrapper: StrictMode });
    const executor = hook.result.current;

    expect(executor.isPending).toBe(false);
    expect(executor.isFulfilled).toBe(false);
    expect(executor.isRejected).toBe(false);
    expect(executor.value).toBe(undefined);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(null);
  });

  test('creates an executor with non-function initial result', () => {
    const hook = renderHook(() => useExecutor('xxx', 111), { wrapper: StrictMode });
    const executor = hook.result.current;

    expect(executor.isPending).toBe(false);
    expect(executor.isFulfilled).toBe(true);
    expect(executor.isRejected).toBe(false);
    expect(executor.value).toBe(111);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(null);
  });

  test('creates an executor with synchronous function initial result', () => {
    const hook = renderHook(() => useExecutor('xxx', () => 111), { wrapper: StrictMode });
    const executor = hook.result.current;

    expect(executor.isPending).toBe(false);
    expect(executor.isFulfilled).toBe(true);
    expect(executor.isRejected).toBe(false);
    expect(executor.value).toBe(111);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(null);
  });

  test('creates an executor with asynchronous function initial result', async () => {
    const hookMock = jest.fn(() => useExecutor('xxx', () => Promise.resolve(111)));
    const hook = renderHook(hookMock, { wrapper: StrictMode });
    const executor1 = hook.result.current;

    expect(executor1.isPending).toBe(true);
    expect(executor1.isFulfilled).toBe(false);
    expect(executor1.isRejected).toBe(false);
    expect(executor1.value).toBe(undefined);
    expect(executor1.reason).toBe(undefined);
    expect(executor1.promise).toBeInstanceOf(Promise);

    await act(() => hook.result.current.promise);

    const executor2 = hook.result.current;

    expect(hookMock).toHaveBeenCalledTimes(4);
    expect(executor2.isPending).toBe(false);
    expect(executor2.isFulfilled).toBe(true);
    expect(executor2.isRejected).toBe(false);
    expect(executor2.value).toBe(111);
    expect(executor2.reason).toBe(undefined);
    expect(executor2.promise).toBe(null);
  });

  test('re-renders after resolve', () => {
    const hookMock = jest.fn(() => useExecutor('xxx'));
    const hook = renderHook(hookMock, { wrapper: StrictMode });

    act(() => void hook.result.current.resolve(111));

    expect(hookMock).toHaveBeenCalledTimes(4);
  });

  test('re-renders after reject', () => {
    const hookMock = jest.fn(() => useExecutor('xxx'));
    const hook = renderHook(hookMock, { wrapper: StrictMode });

    act(() => void hook.result.current.reject(111));

    expect(hookMock).toHaveBeenCalledTimes(4);
  });

  // ------------------------------------------------------------------

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

  // test('uses provider to create an executor', async () => {
  //   const executorManager = new ExecutorManager();
  //   executorManager.createExecutor = jest.fn(() => new Executor());
  //
  //   const Context = (props: PropsWithChildren) =>
  //     createElement(ExecutorManagerContext.Provider, {
  //       value: executorManager,
  //       children: props.children,
  //     });
  //
  //   renderHook(() => useExecutor(), { wrapper: Context });
  //
  //   expect(executorManager.createExecutor).toHaveBeenCalledTimes(1);
  // });
});
