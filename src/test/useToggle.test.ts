import { act, renderHook } from '@testing-library/react';
import { useToggle } from '../main';
import { StrictMode } from 'react';

describe('useToggle', () => {
  test('returns a tuple', () => {
    const hook = renderHook(() => useToggle(), { wrapper: StrictMode });

    expect(hook.result.current).toEqual([
      expect.any(Boolean),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    ]);
  });

  test('returns the same accessor functions on every render', () => {
    const useToggleMock = jest.fn(useToggle);
    const hook = renderHook(() => useToggleMock(), { wrapper: StrictMode });
    const accessor = hook.result.current;

    hook.rerender();

    expect(useToggleMock).toHaveBeenCalledTimes(4);
    expect(hook.result.current[1]).toBe(accessor[1]);
    expect(hook.result.current[2]).toBe(accessor[2]);
    expect(hook.result.current[3]).toBe(accessor[3]);
  });

  test('disabled by default', () => {
    const hook = renderHook(() => useToggle(), { wrapper: StrictMode });

    expect(hook.result.current[0]).toBe(false);
  });

  test('applies initial value', () => {
    const hook = renderHook(() => useToggle(true), { wrapper: StrictMode });

    expect(hook.result.current[0]).toBe(true);
  });

  test('re-renders when enabled', () => {
    const useToggleMock = jest.fn(useToggle);
    const hook = renderHook(() => useToggleMock(), { wrapper: StrictMode });

    act(() => hook.result.current[1]());

    expect(useToggleMock).toHaveBeenCalledTimes(4);
    expect(hook.result.current[0]).toBe(true);
  });

  test('re-renders when disabled', () => {
    const useToggleMock = jest.fn(useToggle);
    const hook = renderHook(() => useToggleMock(), { wrapper: StrictMode });

    act(() => hook.result.current[1]());
    act(() => hook.result.current[2]());

    expect(useToggleMock).toHaveBeenCalledTimes(6);
    expect(hook.result.current[0]).toBe(false);
  });

  test('re-renders when toggled', () => {
    const useToggleMock = jest.fn(useToggle);
    const hook = renderHook(() => useToggleMock(), { wrapper: StrictMode });

    act(() => hook.result.current[3]());

    expect(useToggleMock).toHaveBeenCalledTimes(4);
    expect(hook.result.current[0]).toBe(true);
  });

  test('does not re-render if value is unchanged', () => {
    const useToggleMock = jest.fn(useToggle);
    const hook = renderHook(() => useToggleMock(), { wrapper: StrictMode });

    act(() => hook.result.current[1]());
    act(() => hook.result.current[1]());
    act(() => hook.result.current[1]());
    act(() => hook.result.current[1]());

    expect(useToggleMock).toHaveBeenCalledTimes(6);
    expect(hook.result.current[0]).toBe(true);
  });
});
