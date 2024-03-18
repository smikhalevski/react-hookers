import { act, renderHook } from '@testing-library/react';
import { useInterval } from '../main';
import { StrictMode } from 'react';

jest.useFakeTimers();

describe('useInterval', () => {
  test('returns a new array instance on each render', () => {
    const hook = renderHook(() => useInterval(), { wrapper: StrictMode });
    const protocol = hook.result.current;

    hook.rerender();

    expect(hook.result.current).not.toBe(protocol);
  });

  test('returns same callbacks on every call', () => {
    const hook = renderHook(() => useInterval(), { wrapper: StrictMode });

    const [schedule1, cancel1] = hook.result.current;
    hook.rerender();
    const [schedule2, cancel2] = hook.result.current;

    hook.unmount();

    expect(schedule1).toBe(schedule2);
    expect(cancel1).toBe(cancel2);
  });

  test('invokes the callback', () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useInterval(), { wrapper: StrictMode });

    const [schedule] = hook.result.current;

    act(() => schedule(cbMock, 50));

    jest.runOnlyPendingTimers();

    hook.unmount();

    expect(cbMock).toHaveBeenCalled();
  });

  test('consequent calls override the invoked callback', () => {
    const cbMock1 = jest.fn();
    const cbMock2 = jest.fn();
    const hook = renderHook(() => useInterval(), { wrapper: StrictMode });

    const [schedule] = hook.result.current;

    act(() => schedule(cbMock1, 50));
    act(() => schedule(cbMock2, 50));

    jest.runOnlyPendingTimers();

    hook.unmount();

    expect(cbMock1).not.toHaveBeenCalled();
    expect(cbMock2).toHaveBeenCalled();
  });

  test('does not invoke the callback after unmount', () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useInterval(), { wrapper: StrictMode });

    const [schedule] = hook.result.current;

    act(() => schedule(cbMock, 50));

    hook.unmount();

    jest.runOnlyPendingTimers();

    expect(cbMock).not.toHaveBeenCalled();
  });

  test('the callback invocation is canceled', () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useInterval(), { wrapper: StrictMode });

    const [schedule, cancel] = hook.result.current;

    act(() => schedule(cbMock, 50));
    act(() => cancel());

    jest.runOnlyPendingTimers();

    hook.unmount();

    expect(cbMock).not.toHaveBeenCalled();
  });
});
