/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useBlocker } from '../main/index.js';

test('returns a new array instance on each render', () => {
  const hook = renderHook(() => useBlocker(), { reactStrictMode: true });
  const protocol = hook.result.current;

  hook.rerender();

  expect(hook.result.current).not.toBe(protocol);
});

test('returns the same callbacks on each render', () => {
  const hook = renderHook(() => useBlocker(), { reactStrictMode: true });
  const [, block1, unblock1] = hook.result.current;

  hook.rerender();

  const [, block2, unblock2] = hook.result.current;

  expect(block1).toBe(block2);
  expect(unblock1).toBe(unblock2);
});

test('unblocked by default', () => {
  const hook = renderHook(() => useBlocker(), { reactStrictMode: true });

  expect(hook.result.current[0]).toBe(false);
});

test('blocks', () => {
  const hook = renderHook(() => useBlocker(), { reactStrictMode: true });

  act(() => {
    hook.result.current[1]();
  });

  expect(hook.result.current[0]).toBe(true);
});

test('unblocks with result', async () => {
  const hook = renderHook(() => useBlocker<string>(), { reactStrictMode: true });
  let promise;

  act(() => {
    promise = hook.result.current[1]();
  });

  act(() => hook.result.current[2]('test'));

  await expect(promise).resolves.toBe('test');
  expect(hook.result.current[0]).toBe(false);
});

test('unblocks without result', async () => {
  const hook = renderHook(() => useBlocker(), { reactStrictMode: true });
  let promise;

  act(() => {
    promise = hook.result.current[1]();
  });

  act(() => hook.result.current[2]());

  await expect(promise).resolves.toBe(undefined);
  expect(hook.result.current[0]).toBe(false);
});

test('block/unblock are no-op after unmount', async () => {
  const hookMock = vi.fn(() => useBlocker<string>());
  const hook = renderHook(hookMock, { reactStrictMode: true });

  const [, block, unblock] = hook.result.current;

  hook.unmount();

  void block();
  unblock('aaa');

  expect(hookMock).toHaveBeenCalledTimes(2);
});
