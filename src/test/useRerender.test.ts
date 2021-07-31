import {act, renderHook} from '@testing-library/react-hooks';
import { useEffect } from 'react';
import {useRerender} from '../main/useRerender';

describe('useRerender', () => {

  test('returns function', () => {
    const hook = renderHook(() => useRerender());

    expect(hook.result.current).toBeInstanceOf(Function);
  });

  test('returns same function on every render', () => {
    const useRerenderSpy = jest.fn(useRerender);
    const hook = renderHook(() => useRerenderSpy());
    const fn = hook.result.current;

    hook.rerender();

    expect(useRerenderSpy).toHaveBeenCalledTimes(2);
    expect(hook.result.current).toBe(fn);
  });

  test('re-render component', () => {
    const useRerenderSpy = jest.fn(useRerender);
    const hook = renderHook(() => useRerenderSpy());

    expect(useRerenderSpy).toHaveBeenCalledTimes(1);

    act(() => hook.result.current());
    act(() => hook.result.current());

    expect(useRerenderSpy).toHaveBeenCalledTimes(3);
  });

  test('does not re-render unmounted component', () => {
    const useRerenderSpy = jest.fn(useRerender);
    const hook = renderHook(() => useRerenderSpy());

    hook.unmount();

    act(() => hook.result.current());
    act(() => hook.result.current());

    expect(useRerenderSpy).toHaveBeenCalledTimes(1);
  });

  test('triggers re-render when called from an effect', () => {
    const useRerenderSpy = jest.fn(useRerender);

    renderHook(() => {
      const rerender = useRerenderSpy();

      useEffect(() => rerender(), []);
    });

    expect(useRerenderSpy).toHaveBeenCalledTimes(2);
  });

  test('does not re-render when called during render', () => {
    const useRerenderSpy = jest.fn(useRerender);

    let rerenderEnabled = true;

    renderHook(() => {
      const rerender = useRerenderSpy();

      if (rerenderEnabled) {
        rerenderEnabled = false;
        rerender();
      }
    });

    expect(useRerenderSpy).toHaveBeenCalledTimes(1);
  });

  test('defers re-render when called during render in forced mode', () => {
    const useRerenderSpy = jest.fn(useRerender);

    let rerenderEnabled = true;

    renderHook(() => {
      const rerender = useRerenderSpy();

      if (rerenderEnabled) {
        rerenderEnabled = false;
        rerender(true);
      }
    });

    expect(useRerenderSpy).toHaveBeenCalledTimes(2);
  });
});
