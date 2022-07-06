import { act, renderHook } from '@testing-library/react';
import { useToggle } from '../main';

describe('useToggle', () => {
  test('returns a tuple', () => {
    const hook = renderHook(() => useToggle());

    expect(hook.result.current).toEqual([
      expect.any(Boolean),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    ]);
  });

  test('returns the same accessor on every render', () => {
    const useToggleMock = jest.fn(useToggle);
    const hook = renderHook(() => useToggleMock());
    const accessor = hook.result.current;

    hook.rerender();

    expect(useToggleMock).toHaveBeenCalledTimes(2);
    expect(hook.result.current).toBe(accessor);
  });

  test('disabled by default', () => {
    const hook = renderHook(() => useToggle());

    expect(hook.result.current[0]).toBe(false);
  });

  test('applies initial value', () => {
    const hook = renderHook(() => useToggle(true));

    expect(hook.result.current[0]).toBe(true);
  });

  test('re-renders when enabled', () => {
    const useToggleMock = jest.fn(useToggle);
    const hook = renderHook(() => useToggleMock());

    act(() => hook.result.current[1]());

    expect(useToggleMock).toHaveBeenCalledTimes(2);
    expect(hook.result.current[0]).toBe(true);
  });

  test('re-renders when disabled', () => {
    const useToggleMock = jest.fn(useToggle);
    const hook = renderHook(() => useToggleMock());

    act(() => hook.result.current[1]());
    act(() => hook.result.current[2]());

    expect(useToggleMock).toHaveBeenCalledTimes(3);
    expect(hook.result.current[0]).toBe(false);
  });

  test('re-renders when toggled', () => {
    const useToggleMock = jest.fn(useToggle);
    const hook = renderHook(() => useToggleMock());

    act(() => hook.result.current[3]());

    expect(useToggleMock).toHaveBeenCalledTimes(2);
    expect(hook.result.current[0]).toBe(true);
  });

  test('does not re-render if value is unchanged', async () => {
    const useToggleMock = jest.fn(useToggle);
    const hook = renderHook(() => useToggleMock());

    act(() => hook.result.current[1]());
    act(() => hook.result.current[1]());
    act(() => hook.result.current[1]());
    act(() => hook.result.current[1]());

    expect(useToggleMock).toHaveBeenCalledTimes(3);
    expect(hook.result.current[0]).toBe(true);
  });
});
