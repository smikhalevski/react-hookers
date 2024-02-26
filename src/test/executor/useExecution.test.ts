import { act, renderHook } from '@testing-library/react';
import { useExecution } from '../../main';
import { StrictMode } from 'react';

describe.skip('useExecution', () => {
  test('creates a resolved execution', () => {
    const hook = renderHook(() => useExecution('xxx', () => 'aaa'), { wrapper: StrictMode });
    const execution = hook.result.current;

    expect(execution.isPending).toBe(false);
    expect(execution.isFulfilled).toBe(true);
    expect(execution.isRejected).toBe(false);
    expect(execution.value).toBe('aaa');
    expect(execution.reason).toBe(undefined);
    expect(execution.promise).toBe(null);
  });

  test('creates a pending execution', async () => {
    const hook = renderHook(() => useExecution('xxx', () => Promise.resolve('aaa')), { wrapper: StrictMode });
    const execution = hook.result.current;

    expect(execution.isPending).toBe(true);
    expect(execution.isFulfilled).toBe(false);
    expect(execution.isRejected).toBe(false);
    expect(execution.value).toBe(undefined);
    expect(execution.reason).toBe(undefined);
    expect(execution.promise).not.toBe(undefined);

    await act(() => hook.result.current.promise);
  });

  test('invokes callback once during initial render', () => {
    const cbMock = jest.fn(() => 'aaa');

    renderHook(() => useExecution('xxx', cbMock), { wrapper: StrictMode });

    expect(cbMock).toHaveBeenCalledTimes(2);
  });

  test('invokes async callback once during initial render', async () => {
    const cbMock = jest.fn(() => Promise.resolve('aaa'));
    const hook = renderHook(() => useExecution('xxx', cbMock), { wrapper: StrictMode });
    const execution = hook.result.current;

    expect(execution.isPending).toBe(true);
    expect(cbMock).toHaveBeenCalledTimes(2);

    await act(() => execution.promise);

    expect(hook.result.current.isPending).toBe(false);
    expect(cbMock).toHaveBeenCalledTimes(2);
  });

  test('repeats the execution if deps were changed', () => {
    const cbMock = jest.fn(() => 'foo');
    const hookMock = jest.fn(deps => useExecution(cbMock, deps));

    const hook = renderHook(hookMock, { wrapper: StrictMode, initialProps: [111] });

    expect(cbMock).toHaveBeenCalledTimes(2);
    expect(hookMock).toHaveBeenCalledTimes(2);
    expect(hook.result.current.value).toBe('foo');

    hook.rerender([111]);

    expect(cbMock).toHaveBeenCalledTimes(2);
    expect(hookMock).toHaveBeenCalledTimes(4);
    expect(hook.result.current.value).toBe('foo');

    cbMock.mockImplementation(() => 'bar');
    hook.rerender([222]);

    expect(cbMock).toHaveBeenCalledTimes(3);
    expect(hookMock).toHaveBeenCalledTimes(8);
    expect(hook.result.current.value).toBe('bar');
  });
});
