import { act, renderHook } from '@testing-library/react-hooks/native';
import { useEffect } from 'react';
import { useRerender } from '../../main';

describe('useRerender', () => {
  test('returns function', () => {
    const hook = renderHook(() => useRerender());

    expect(hook.result.current).toBeInstanceOf(Function);
  });

  test('returns same function on every render', () => {
    const useRerenderMock = jest.fn(useRerender);
    const hook = renderHook(() => useRerenderMock());
    const fn = hook.result.current;

    hook.rerender();

    expect(useRerenderMock).toHaveBeenCalledTimes(2);
    expect(hook.result.current).toBe(fn);
  });

  test('re-render component', () => {
    const useRerenderMock = jest.fn(useRerender);
    const hook = renderHook(() => useRerenderMock());

    expect(useRerenderMock).toHaveBeenCalledTimes(1);

    act(() => hook.result.current());
    act(() => hook.result.current());

    expect(useRerenderMock).toHaveBeenCalledTimes(3);
  });

  test('does not re-render unmounted component', () => {
    const useRerenderMock = jest.fn(useRerender);
    const hook = renderHook(() => useRerenderMock());

    hook.unmount();

    act(() => hook.result.current());
    act(() => hook.result.current());

    expect(useRerenderMock).toHaveBeenCalledTimes(1);
  });

  test('triggers re-render when called from an effect', () => {
    const useRerenderMock = jest.fn(useRerender);

    renderHook(() => {
      const rerender = useRerenderMock();

      useEffect(() => rerender(), []);
    });

    expect(useRerenderMock).toHaveBeenCalledTimes(2);
  });

  test('defers re-render when called during render', () => {
    const useRerenderMock = jest.fn(useRerender);

    let rerenderCount = 0;

    renderHook(() => {
      const rerender = useRerenderMock();

      if (rerenderCount < 3) {
        ++rerenderCount;
        rerender();
      }
    });

    expect(useRerenderMock).toHaveBeenCalledTimes(4);
  });
});
