/**
 * @vitest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { expect, test, vi } from 'vitest';
import { useHandler } from '../main/index.js';

test('returns a function', () => {
  const hook = renderHook(() => useHandler(() => 111), { wrapper: StrictMode });

  expect(hook.result.current).toStrictEqual(expect.any(Function));
});

test('returns the same function on each render', () => {
  const hook = renderHook(() => useHandler(() => 111), { wrapper: StrictMode });
  const handler = hook.result.current;

  hook.rerender();

  expect(hook.result.current).toBe(handler);
});

test('returned function replicates the handler signature', () => {
  const hook = renderHook(() => useHandler((a, b) => a * 2 + b), { wrapper: StrictMode });

  expect(hook.result.current(3, 4)).toBe(10);
});

test('no-op after unmount', () => {
  const cbMock = vi.fn();
  const hook = renderHook(() => useHandler(cbMock), { wrapper: StrictMode });
  const handler = hook.result.current;

  hook.unmount();

  handler();

  expect(cbMock).not.toHaveBeenCalled();
});
