import { act, renderHook } from '@testing-library/react';
import { useExecution } from '../main';
import { StrictMode } from 'react';

describe('useExecution', () => {
  test('creates a resolved execution', () => {
    const hook = renderHook(() => useExecution(() => 'aaa'), { wrapper: StrictMode });
    const execution = hook.result.current;

    expect(execution.isPending).toBe(false);
    expect(execution.isFulfilled).toBe(true);
    expect(execution.isRejected).toBe(false);
    expect(execution.result).toBe('aaa');
    expect(execution.reason).toBe(undefined);
    expect(execution.promise).toBe(null);
  });

  test('creates a pending execution', async () => {
    const hook = renderHook(() => useExecution(() => Promise.resolve('aaa')), { wrapper: StrictMode });
    const execution = hook.result.current;

    expect(execution.isPending).toBe(true);
    expect(execution.isFulfilled).toBe(false);
    expect(execution.isRejected).toBe(false);
    expect(execution.result).toBe(undefined);
    expect(execution.reason).toBe(undefined);
    expect(execution.promise).not.toBe(undefined);

    await act(() => hook.result.current.promise);
  });

  test('repeats the execution if deps were changed', () => {
    let dep = 'foo';

    const cbMock = jest.fn(() => dep);
    const hookMock = jest.fn(() => useExecution(cbMock, [dep]));

    const hook = renderHook(hookMock, { wrapper: StrictMode });

    expect(cbMock).toHaveBeenCalledTimes(2);
    expect(hookMock).toHaveBeenCalledTimes(4);
    expect(hook.result.current.result).toBe('foo');

    hook.rerender();

    expect(cbMock).toHaveBeenCalledTimes(2);
    expect(hookMock).toHaveBeenCalledTimes(6);
    expect(hook.result.current.result).toBe('foo');

    dep = 'bar';
    hook.rerender();

    expect(cbMock).toHaveBeenCalledTimes(3);
    expect(hookMock).toHaveBeenCalledTimes(10);
    expect(hook.result.current.result).toBe('bar');
  });
});
