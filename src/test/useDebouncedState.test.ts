/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useDebouncedState } from '../main/index.js';

vi.useFakeTimers();

test('returns a new array instance on each render', () => {
  const hook = renderHook(() => useDebouncedState(10), { reactStrictMode: true });
  const protocol = hook.result.current;

  hook.rerender();

  expect(hook.result.current).not.toBe(protocol);
});

test('returns the same callback on every call', () => {
  const hook = renderHook(() => useDebouncedState(10), { reactStrictMode: true });

  const setState1 = hook.result.current[2];
  hook.rerender();

  const setState2 = hook.result.current[2];

  expect(setState1).toBe(setState2);
});

test('updates current state after the delay', async () => {
  const hookMock = vi.fn(() => useDebouncedState(10, 'aaa'));

  const hook = renderHook(hookMock, { reactStrictMode: true });

  const [value1, debouncedValue1, setState] = hook.result.current;

  expect(hookMock).toHaveBeenCalledTimes(2);
  expect(value1).toBe('aaa');
  expect(debouncedValue1).toBe('aaa');

  act(() => setState('bbb'));

  const [value2, debouncedValue2] = hook.result.current;

  expect(hookMock).toHaveBeenCalledTimes(4);
  expect(value2).toBe('bbb');
  expect(debouncedValue2).toBe('aaa');

  act(() => vi.runOnlyPendingTimers());

  const [value3, debouncedValue3] = hook.result.current;

  expect(hookMock).toHaveBeenCalledTimes(6);
  expect(value3).toBe('bbb');
  expect(debouncedValue3).toBe('bbb');
});

test('does not re-render if next state is unchanged', async () => {
  const hookMock = vi.fn(() => useDebouncedState(10, 'aaa'));
  const hook = renderHook(hookMock, { reactStrictMode: true });

  const [, , setState] = hook.result.current;

  act(() => setState('aaa'));

  expect(hookMock).toHaveBeenCalledTimes(2);

  act(() => vi.runOnlyPendingTimers());

  expect(hookMock).toHaveBeenCalledTimes(2);
});

test('does not re-render if current state is unchanged', async () => {
  const hookMock = vi.fn(() => useDebouncedState(10, 'aaa'));
  const hook = renderHook(hookMock, { reactStrictMode: true });

  const [, , setState] = hook.result.current;

  act(() => setState('bbb'));
  act(() => setState('aaa'));

  act(() => vi.runOnlyPendingTimers());

  expect(hookMock).toHaveBeenCalledTimes(8);
});

test('consequent sets cause the current state to be updated only once', async () => {
  const hookMock = vi.fn(() => useDebouncedState(10, 'aaa'));
  const hook = renderHook(hookMock, { reactStrictMode: true });

  const [, , setState] = hook.result.current;

  act(() => setState('bbb'));
  act(() => setState('ccc'));

  act(() => vi.runOnlyPendingTimers());

  const [value] = hook.result.current;

  expect(value).toBe('ccc');
  expect(hookMock).toHaveBeenCalledTimes(8);
});

test('does not invoke the callback after unmount', async () => {
  const hook = renderHook(() => useDebouncedState(50, 'aaa'), { reactStrictMode: true });

  const [, , setState] = hook.result.current;

  act(() => setState('bbb'));

  hook.unmount();

  act(() => vi.runOnlyPendingTimers());

  const [value, debouncedValue] = hook.result.current;

  expect(value).toBe('bbb');
  expect(debouncedValue).toBe('aaa');
});
