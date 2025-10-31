/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import { expect, test, vi } from 'vitest';
import { useRerender } from '../main/index.js';

test('returns a function', () => {
  const hook = renderHook(() => useRerender(), { reactStrictMode: true });

  expect(hook.result.current).toBeInstanceOf(Function);
});

test('returns the same function on every render', () => {
  const useRerenderMock = vi.fn(useRerender);
  const hook = renderHook(() => useRerenderMock(), { reactStrictMode: true });
  const fn = hook.result.current;

  hook.rerender();

  expect(useRerenderMock).toHaveBeenCalledTimes(4);
  expect(hook.result.current).toBe(fn);
});

test('re-render a component', () => {
  const useRerenderMock = vi.fn(useRerender);
  const hook = renderHook(() => useRerenderMock(), { reactStrictMode: true });

  expect(useRerenderMock).toHaveBeenCalledTimes(2);

  act(() => hook.result.current());
  act(() => hook.result.current());

  expect(useRerenderMock).toHaveBeenCalledTimes(6);
});

test('does not re-render an unmounted component', () => {
  const useRerenderMock = vi.fn(useRerender);
  const hook = renderHook(() => useRerenderMock(), { reactStrictMode: true });

  hook.unmount();

  act(() => hook.result.current());
  act(() => hook.result.current());

  expect(useRerenderMock).toHaveBeenCalledTimes(2);
});

test('triggers re-render when called from an effect', () => {
  const useRerenderMock = vi.fn(useRerender);

  renderHook(
    () => {
      const rerender = useRerenderMock();

      useEffect(() => rerender(), []);
    },
    { reactStrictMode: true }
  );

  expect(useRerenderMock).toHaveBeenCalledTimes(4);
});

test('defers re-render when called during a render', () => {
  const useRerenderMock = vi.fn(useRerender);

  let rerenderCount = 0;

  renderHook(
    () => {
      const rerender = useRerenderMock();

      if (rerenderCount < 3) {
        ++rerenderCount;
        rerender();
      }
    },
    { reactStrictMode: true }
  );

  expect(useRerenderMock).toHaveBeenCalledTimes(5);
});
