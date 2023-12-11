import { renderHook } from '@testing-library/react';
import { sleep } from 'parallel-universe';
import { usePolling } from '../main';

describe('usePolling', () => {
  test('returns the same execution on every render', () => {
    const hook = renderHook(() => usePolling(() => 'aaa', 10));
    const execution1 = hook.result.current;

    hook.rerender();
    const execution2 = hook.result.current;

    expect(execution1).toBe(execution2);
  });

  test('creates a resolved execution', async () => {
    const cbMock = jest.fn(() => 'aaa');
    const hook = renderHook(() => usePolling(cbMock, 10));

    await sleep(100);

    const execution = hook.result.current;

    expect(execution.isFulfilled).toBe(true);
    expect(execution.isRejected).toBe(false);
    expect(execution.result).toBe('aaa');
    expect(execution.reason).toBe(undefined);
    expect(cbMock.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  test('stops polling after unmount', async () => {
    const cbMock = jest.fn(() => 'aaa');
    const hook = renderHook(() => usePolling(cbMock, 10));

    await sleep(100);

    hook.unmount();

    const cbMockCallsCount = cbMock.mock.calls.length;

    await sleep(100);

    expect(cbMock.mock.calls.length).toBe(cbMockCallsCount);
  });
});
