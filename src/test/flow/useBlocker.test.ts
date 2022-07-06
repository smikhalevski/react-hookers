import { act, renderHook } from '@testing-library/react';
import { useBlocker } from '../../main';

describe('useBlocker', () => {
  test('unblocked by default', () => {
    const hook = renderHook(() => useBlocker());

    expect(hook.result.current[0]).toBe(false);
  });

  test('blocks', () => {
    const hook = renderHook(() => useBlocker());

    act(() => {
      hook.result.current[1]();
    });

    expect(hook.result.current[0]).toBe(true);
  });

  test('unblocks with result', async () => {
    const hook = renderHook(() => useBlocker<string>());
    let promise;

    act(() => {
      promise = hook.result.current[1]();
    });

    act(() => hook.result.current[2]('test'));

    await expect(promise).resolves.toBe('test');
    expect(hook.result.current[0]).toBe(false);
  });

  test('unblocks without result', async () => {
    const hook = renderHook(() => useBlocker());
    let promise;

    act(() => {
      promise = hook.result.current[1]();
    });

    act(() => hook.result.current[2]());

    await expect(promise).resolves.toBe(undefined);
    expect(hook.result.current[0]).toBe(false);
  });
});
