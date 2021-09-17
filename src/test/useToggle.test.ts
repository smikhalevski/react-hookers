import {act, renderHook} from '@testing-library/react-hooks';
import {useToggle} from '../main/useToggle';

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
    const useToggleSpy = jest.fn(useToggle);
    const hook = renderHook(() => useToggleSpy());
    const accessor = hook.result.current;

    hook.rerender();

    expect(useToggleSpy).toHaveBeenCalledTimes(2);
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
    const useToggleSpy = jest.fn(useToggle);
    const hook = renderHook(() => useToggleSpy());

    act(() => hook.result.current[1]());

    expect(useToggleSpy).toHaveBeenCalledTimes(2);
    expect(hook.result.current[0]).toBe(true);
  });

  test('re-renders when disabled', () => {
    const useToggleSpy = jest.fn(useToggle);
    const hook = renderHook(() => useToggleSpy());

    act(() => hook.result.current[1]());
    act(() => hook.result.current[2]());

    expect(useToggleSpy).toHaveBeenCalledTimes(3);
    expect(hook.result.current[0]).toBe(false);
  });

  test('re-renders when toggled', () => {
    const useToggleSpy = jest.fn(useToggle);
    const hook = renderHook(() => useToggleSpy());

    act(() => hook.result.current[3]());

    expect(useToggleSpy).toHaveBeenCalledTimes(2);
    expect(hook.result.current[0]).toBe(true);
  });

  test('does not re-render if value is unchanged', async () => {
    const useToggleSpy = jest.fn(useToggle);
    const hook = renderHook(() => useToggleSpy());

    act(() => hook.result.current[1]());
    act(() => hook.result.current[1]());
    act(() => hook.result.current[1]());
    act(() => hook.result.current[1]());

    expect(useToggleSpy).toHaveBeenCalledTimes(3);
    expect(hook.result.current[0]).toBe(true);
  });
});
