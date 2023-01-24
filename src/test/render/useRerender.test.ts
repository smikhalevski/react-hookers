import { act, renderHook } from '@testing-library/react';
import { StrictMode, useEffect } from 'react';
import { useRerender } from '../../main';

describe('useRerender', () => {
  test('returns a function', () => {
    const hook = renderHook(() => useRerender(), { wrapper: StrictMode });

    expect(hook.result.current).toBeInstanceOf(Function);
  });

  test('returns the same function on every render', () => {
    const useRerenderMock = jest.fn(useRerender);
    const hook = renderHook(() => useRerenderMock(), { wrapper: StrictMode });
    const fn = hook.result.current;

    hook.rerender();

    expect(useRerenderMock).toHaveBeenCalledTimes(4);
    expect(hook.result.current).toBe(fn);
  });

  test('re-render a component', () => {
    const useRerenderMock = jest.fn(useRerender);
    const hook = renderHook(() => useRerenderMock(), { wrapper: StrictMode });

    expect(useRerenderMock).toHaveBeenCalledTimes(2);

    act(() => hook.result.current());
    act(() => hook.result.current());

    expect(useRerenderMock).toHaveBeenCalledTimes(6);
  });

  test('does not re-render an unmounted component', () => {
    const useRerenderMock = jest.fn(useRerender);
    const hook = renderHook(() => useRerenderMock(), { wrapper: StrictMode });

    hook.unmount();

    act(() => hook.result.current());
    act(() => hook.result.current());

    expect(useRerenderMock).toHaveBeenCalledTimes(2);
  });

  test('triggers re-render when called from an effect', () => {
    const useRerenderMock = jest.fn(useRerender);

    renderHook(
      () => {
        const rerender = useRerenderMock();

        useEffect(() => rerender(), []);
      },
      { wrapper: StrictMode }
    );

    expect(useRerenderMock).toHaveBeenCalledTimes(4);
  });

  test('defers re-render when called during a render', () => {
    const useRerenderMock = jest.fn(useRerender);

    let rerenderCount = 0;

    renderHook(
      () => {
        const rerender = useRerenderMock();

        if (rerenderCount < 3) {
          ++rerenderCount;
          rerender();
        }
      },
      { wrapper: StrictMode }
    );

    expect(useRerenderMock).toHaveBeenCalledTimes(5);
  });
});
