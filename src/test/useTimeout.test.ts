/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { expect, test, vi } from 'vitest';
import { useTimeout } from '../main/index.js';

vi.useFakeTimers();

test('returns a new array instance on each render', () => {
  const hook = renderHook(() => useTimeout(), { wrapper: StrictMode });
  const protocol = hook.result.current;

  hook.rerender();

  expect(hook.result.current).not.toBe(protocol);
});

test('returns the same callbacks on every call', () => {
  const hook = renderHook(() => useTimeout(), { wrapper: StrictMode });

  const [debounce1, cancel1] = hook.result.current;
  hook.rerender();
  const [debounce2, cancel2] = hook.result.current;

  expect(debounce1).toBe(debounce2);
  expect(cancel1).toBe(cancel2);
});

test('invokes the callback', async () => {
  const cbMock = vi.fn();
  const hook = renderHook(() => useTimeout(), { wrapper: StrictMode });

  const [debounce] = hook.result.current;

  act(() => debounce(cbMock, 50));

  vi.runOnlyPendingTimers();

  expect(cbMock).toHaveBeenCalled();
});

test('consequent calls override the invoked callback', async () => {
  const cbMock1 = vi.fn();
  const cbMock2 = vi.fn();
  const hook = renderHook(() => useTimeout(), { wrapper: StrictMode });

  const [debounce] = hook.result.current;

  act(() => debounce(cbMock1, 50));
  act(() => debounce(cbMock2, 50));

  vi.runOnlyPendingTimers();

  expect(cbMock1).not.toHaveBeenCalled();
  expect(cbMock2).toHaveBeenCalled();
});

test('does not invoke the callback after unmount', async () => {
  const cbMock = vi.fn();
  const hook = renderHook(() => useTimeout(), { wrapper: StrictMode });

  const [debounce] = hook.result.current;

  act(() => debounce(cbMock, 50));

  hook.unmount();

  vi.runOnlyPendingTimers();

  expect(cbMock).not.toHaveBeenCalled();
});

test('the callback invocation is canceled', async () => {
  const cbMock = vi.fn();
  const hook = renderHook(() => useTimeout(), { wrapper: StrictMode });

  const [debounce, cancel] = hook.result.current;

  act(() => debounce(cbMock, 50));

  act(() => cancel());

  vi.runOnlyPendingTimers();

  expect(cbMock).not.toHaveBeenCalled();
});
