import { renderHook } from '@testing-library/react-hooks/native';
import { useExecution } from '../../main';

describe('useExecution', () => {
  test('returns the same execution on every render', () => {
    const hook = renderHook(() => useExecution(() => 'abc'));
    const execution1 = hook.result.current;

    hook.rerender();
    const execution2 = hook.result.current;

    expect(execution1).toBe(execution2);
  });

  test('creates a resolved execution', () => {
    const hook = renderHook(() => useExecution(() => 'abc'));
    const execution = hook.result.current;

    expect(execution.pending).toBe(false);
    expect(execution.resolved).toBe(true);
    expect(execution.rejected).toBe(false);
    expect(execution.result).toBe('abc');
    expect(execution.reason).toBe(undefined);
    expect(execution.promise).toBe(undefined);
  });

  test('creates a pending execution', async () => {
    const hook = renderHook(() => useExecution(() => Promise.resolve('abc')));
    const execution = hook.result.current;

    expect(execution.pending).toBe(true);
    expect(execution.resolved).toBe(false);
    expect(execution.rejected).toBe(false);
    expect(execution.result).toBe(undefined);
    expect(execution.reason).toBe(undefined);
    expect(execution.promise).not.toBe(undefined);

    await hook.waitForNextUpdate();

    expect(execution.pending).toBe(false);
    expect(execution.resolved).toBe(true);
    expect(execution.result).toBe('abc');
    expect(execution.promise).toBe(undefined);
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
