/**
 * @vitest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useHandler } from '../main/index.js';

test('returns a function', () => {
  const hook = renderHook(() => useHandler(() => 111), { reactStrictMode: true });

  expect(hook.result.current).toStrictEqual(expect.any(Function));
});

test('returns the same function on each render', () => {
  const hook = renderHook(() => useHandler(() => 111), { reactStrictMode: true });
  const handler = hook.result.current;

  hook.rerender();

  expect(hook.result.current).toBe(handler);
});

test('returned function replicates the handler signature', () => {
  const hook = renderHook(() => useHandler((a, b) => a * 2 + b), { reactStrictMode: true });

  expect(hook.result.current(3, 4)).toBe(10);
});

test('no-op after unmount', () => {
  const cbMock = vi.fn();
  const hook = renderHook(() => useHandler(cbMock), { reactStrictMode: true });
  const handler = hook.result.current;

  hook.unmount();

  handler();

  expect(cbMock).not.toHaveBeenCalled();
});
