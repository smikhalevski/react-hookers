import { renderHook } from '@testing-library/react';
import { useExecution } from '../main';

describe('useExecution', () => {
  test('creates a resolved execution', () => {
    const hook = renderHook(() => useExecution(() => 'aaa'));
    const execution = hook.result.current;

    expect(execution.isPending).toBe(false);
    expect(execution.isFulfilled).toBe(true);
    expect(execution.isRejected).toBe(false);
    expect(execution.result).toBe('aaa');
    expect(execution.reason).toBe(undefined);
    expect(execution.promise).toBe(undefined);
  });

  test('creates a pending execution', async () => {
    const hook = renderHook(() => useExecution(() => Promise.resolve('aaa')));
    const execution = hook.result.current;

    expect(execution.isPending).toBe(true);
    expect(execution.isFulfilled).toBe(false);
    expect(execution.isRejected).toBe(false);
    expect(execution.result).toBe(undefined);
    expect(execution.reason).toBe(undefined);
    expect(execution.promise).not.toBe(undefined);
  });

  test('repeats the execution if deps were changed', () => {
    let dep = 'foo';

    const cbMock = jest.fn(() => dep);
    const hookMock = jest.fn(() => useExecution(cbMock, [dep]));

    const hook = renderHook(hookMock);

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(hookMock).toHaveBeenCalledTimes(2);
    expect(hook.result.current.result).toBe('foo');

    hook.rerender();

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(hookMock).toHaveBeenCalledTimes(3);
    expect(hook.result.current.result).toBe('foo');

    dep = 'bar';
    hook.rerender();

    expect(cbMock).toHaveBeenCalledTimes(2);
    expect(hookMock).toHaveBeenCalledTimes(5);
    expect(hook.result.current.result).toBe('bar');
  });
});
