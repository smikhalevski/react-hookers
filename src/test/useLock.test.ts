import { act, renderHook } from '@testing-library/react';
import { useLock } from '../main';
import { StrictMode } from 'react';

describe('useLock', () => {
  test('returns a new array instance on each render', () => {
    const hook = renderHook(() => useLock(), { wrapper: StrictMode });
    const protocol = hook.result.current;

    hook.rerender();

    expect(hook.result.current).not.toBe(protocol);
  });

  test('returns the same callback on each render', () => {
    const hook = renderHook(() => useLock(), { wrapper: StrictMode });
    const [, acquire1] = hook.result.current;

    hook.rerender();

    const [, acquire2] = hook.result.current;

    expect(acquire1).toBe(acquire2);
  });

  test('unlocked by default', () => {
    const hook = renderHook(() => useLock(), { wrapper: StrictMode });

    expect(hook.result.current[0]).toBe(false);
  });

  test('locks', () => {
    const hook = renderHook(() => useLock(), { wrapper: StrictMode });

    act(() => {
      hook.result.current[1]();
    });

    expect(hook.result.current[0]).toBe(true);
  });

  test('releases a lock', async () => {
    const hook = renderHook(() => useLock(), { wrapper: StrictMode });

    const release = await act(() => hook.result.current[1]());

    expect(release).toBeInstanceOf(Function);

    act(() => release());

    expect(hook.result.current[0]).toBe(false);
  });
});
