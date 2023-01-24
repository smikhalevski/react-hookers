import { renderHook } from '@testing-library/react';
import { useSemanticCallback } from '../../main';
import { StrictMode } from 'react';

describe('useSemanticCallback', () => {
  test('runs the callback', () => {
    const cb = () => undefined;
    const hook = renderHook(() => useSemanticCallback(cb, undefined), { wrapper: StrictMode });

    expect(hook.result.current).toBe(cb);
  });

  test('returns the same callback on each render', () => {
    const cb = () => undefined;
    const hook = renderHook(() => useSemanticCallback(cb, undefined), { wrapper: StrictMode });

    hook.rerender();
    expect(hook.result.current).toBe(cb);

    hook.rerender();
    expect(hook.result.current).toBe(cb);
  });

  test('updates the callback when deps are changed', () => {
    let dep = 1;

    const cb1 = () => undefined;
    const cb2 = () => undefined;
    const cbProvider = jest.fn();

    cbProvider.mockReturnValue(cb1);

    const hook = renderHook(() => useSemanticCallback(cbProvider(), [dep]), { wrapper: StrictMode });

    cbProvider.mockReturnValue(cb2);

    expect(hook.result.current).toBe(cb1);

    hook.rerender();
    expect(hook.result.current).toBe(cb1);

    dep = 2;
    hook.rerender();
    expect(hook.result.current).toBe(cb2);
  });
});
