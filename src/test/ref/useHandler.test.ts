import { renderHook } from '@testing-library/react';
import { useHandler } from '../../main';
import { StrictMode } from 'react';

describe('useHandler', () => {
  test('returns a function', () => {
    const hook = renderHook(() => useHandler(() => 111), { wrapper: StrictMode });

    expect(hook.result.current).toEqual(expect.any(Function));
  });

  test('returns the same function on each render', () => {
    const hook = renderHook(() => useHandler(() => 111), { wrapper: StrictMode });
    const fn = hook.result.current;

    hook.rerender();

    expect(hook.result.current).toBe(fn);
  });

  test('returned function replicates the handler signature', () => {
    const hook = renderHook(() => useHandler((a, b) => a * 2 + b), { wrapper: StrictMode });

    expect(hook.result.current(3, 4)).toBe(10);
  });
});
