import React from 'react';
import {act, renderHook} from '@testing-library/react-hooks';
import {useBlocker} from '../main/useBlocker';

describe('useBlocker', () => {

  test('unblocked by default', () => {
    const hook = renderHook(() => useBlocker());

    expect(hook.result.current.blocked).toBe(false);
  });

  test('blocks', () => {
    const hook = renderHook(() => useBlocker());

    act(() => {
      hook.result.current.block();
    });

    expect(hook.result.current.blocked).toBe(true);
  });

  test('unblocks with result', async () => {
    const hook = renderHook(() => useBlocker<string>());
    let promise;

    act(() => {
      promise = hook.result.current.block();
    });

    act(() => hook.result.current.unblock('test'));

    await expect(promise).resolves.toBe('test');
    expect(hook.result.current.blocked).toBe(false);
  });

  test('unblocks without result', async () => {
    const hook = renderHook(() => useBlocker());
    let promise;

    act(() => {
      promise = hook.result.current.block();
    });

    act(() => hook.result.current.unblock());

    await expect(promise).resolves.toBe(undefined);
    expect(hook.result.current.blocked).toBe(false);
  });
});
