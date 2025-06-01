/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { expect, test, vi } from 'vitest';
import { useAnimationFrame } from '../main/index.js';

vi.useFakeTimers();

globalThis.requestAnimationFrame = cb => setTimeout(cb, 0);

globalThis.cancelAnimationFrame = handle => clearTimeout(handle);

test('returns a new array instance on each render', () => {
  const hook = renderHook(() => useAnimationFrame(), { wrapper: StrictMode });
  const protocol = hook.result.current;

  hook.rerender();

  expect(hook.result.current).not.toBe(protocol);
});

test('returns same callbacks on every call', () => {
  const hook = renderHook(() => useAnimationFrame(), { wrapper: StrictMode });

  const [start1, stop1] = hook.result.current;
  hook.rerender();
  const [start2, stop2] = hook.result.current;

  hook.unmount();

  expect(start1).toBe(start2);
  expect(stop1).toBe(stop2);
});

test('invokes the callback', async () => {
  const cbMock = vi.fn();
  const hook = renderHook(() => useAnimationFrame(), { wrapper: StrictMode });

  const [start] = hook.result.current;

  act(() => start(cbMock));

  vi.runOnlyPendingTimers();

  hook.unmount();

  expect(cbMock).toHaveBeenCalled();
});

test('consequent calls override the invoked callback', async () => {
  const cbMock1 = vi.fn();
  const cbMock2 = vi.fn();
  const hook = renderHook(() => useAnimationFrame(), { wrapper: StrictMode });

  const [start] = hook.result.current;

  act(() => start(cbMock1));
  act(() => start(cbMock2));

  vi.runOnlyPendingTimers();

  hook.unmount();

  expect(cbMock1).not.toHaveBeenCalled();
  expect(cbMock2).toHaveBeenCalled();
});

test('does not invoke the callback after unmount', async () => {
  const cbMock = vi.fn();
  const hook = renderHook(() => useAnimationFrame(), { wrapper: StrictMode });

  const [start] = hook.result.current;

  act(() => start(cbMock));

  hook.unmount();

  vi.runOnlyPendingTimers();

  expect(cbMock).not.toHaveBeenCalled();
});

test('the callback invocation is canceled', async () => {
  const cbMock = vi.fn();
  const hook = renderHook(() => useAnimationFrame(), { wrapper: StrictMode });

  const [start, stop] = hook.result.current;

  act(() => start(cbMock));

  act(() => stop());

  vi.runOnlyPendingTimers();

  hook.unmount();

  expect(cbMock).not.toHaveBeenCalled();
});
