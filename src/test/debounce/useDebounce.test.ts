import { act, renderHook } from '@testing-library/react';
import { useDebounce } from '../../main';
import { StrictMode } from 'react';

jest.useFakeTimers();

describe('useDebounce', () => {
  test('returns a new array instance on each render', () => {
    const hook = renderHook(() => useDebounce(), { wrapper: StrictMode });
    const protocol = hook.result.current;

    hook.rerender();

    expect(hook.result.current).not.toBe(protocol);
  });

  test('returns the same callbacks on every call', () => {
    const hook = renderHook(() => useDebounce(), { wrapper: StrictMode });

    const [debounce1, cancel1] = hook.result.current;
    hook.rerender();
    const [debounce2, cancel2] = hook.result.current;

    expect(debounce1).toBe(debounce2);
    expect(cancel1).toBe(cancel2);
  });

  test('invokes the callback', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useDebounce(), { wrapper: StrictMode });

    const [debounce] = hook.result.current;

    act(() => debounce(cbMock, 50));

    jest.runOnlyPendingTimers();

    expect(cbMock).toHaveBeenCalled();
  });

  test('consequent calls override the invoked callback', async () => {
    const cbMock1 = jest.fn();
    const cbMock2 = jest.fn();
    const hook = renderHook(() => useDebounce(), { wrapper: StrictMode });

    const [debounce] = hook.result.current;

    act(() => debounce(cbMock1, 50));
    act(() => debounce(cbMock2, 50));

    jest.runOnlyPendingTimers();

    expect(cbMock1).not.toHaveBeenCalled();
    expect(cbMock2).toHaveBeenCalled();
  });

  test('does not invoke the callback after unmount', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useDebounce(), { wrapper: StrictMode });

    const [debounce] = hook.result.current;

    act(() => debounce(cbMock, 50));

    hook.unmount();

    jest.runOnlyPendingTimers();

    expect(cbMock).not.toHaveBeenCalled();
  });

  test('the callback invocation is canceled', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useDebounce(), { wrapper: StrictMode });

    const [debounce, cancel] = hook.result.current;

    act(() => debounce(cbMock, 50));

    act(() => cancel());

    jest.runOnlyPendingTimers();

    expect(cbMock).not.toHaveBeenCalled();
  });
});
