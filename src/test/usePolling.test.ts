import { renderHook } from '@testing-library/react';
import { usePolling } from '../main';
import { StrictMode } from 'react';

jest.useFakeTimers();

describe('usePolling', () => {
  test('returns the new execution on every render', () => {
    const hook = renderHook(() => usePolling(() => 'aaa', 10), { wrapper: StrictMode });
    const execution1 = hook.result.current;

    hook.rerender();

    const execution2 = hook.result.current;

    expect(execution1).not.toBe(execution2);
  });

  test('creates a resolved execution', () => {
    const cbMock = jest.fn(() => 'aaa');
    const hook = renderHook(() => usePolling(cbMock, 10), { wrapper: StrictMode });

    jest.advanceTimersToNextTimer(20);
    jest.runOnlyPendingTimers();

    const execution = hook.result.current;

    expect(execution.isFulfilled).toBe(true);
    expect(execution.isRejected).toBe(false);
    expect(execution.result).toBe('aaa');
    expect(execution.reason).toBe(undefined);
    expect(cbMock.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  test('stops polling after unmount', () => {
    const cbMock = jest.fn(() => 'aaa');
    const hook = renderHook(() => usePolling(cbMock, 10), { wrapper: StrictMode });

    jest.advanceTimersToNextTimer(20);
    jest.runOnlyPendingTimers();

    hook.unmount();

    const cbMockCallsCount = cbMock.mock.calls.length;

    jest.advanceTimersToNextTimer(20);
    jest.runOnlyPendingTimers();

    expect(cbMock.mock.calls.length).toBe(cbMockCallsCount);
  });
});
