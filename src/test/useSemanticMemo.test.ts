import { renderHook } from '@testing-library/react';
import { useSemanticMemo } from '../main';
import { StrictMode } from 'react';

describe('useSemanticMemo', () => {
  test('runs factory invocation result', () => {
    const hook = renderHook(() => useSemanticMemo(() => 111, undefined), { wrapper: StrictMode });

    expect(hook.result.current).toBe(111);
  });

  test('runs factory only once in non-strict mode', () => {
    const factoryMock = jest.fn();
    const hook = renderHook(() => useSemanticMemo(factoryMock, []));

    hook.rerender();
    hook.rerender();
    hook.rerender();

    expect(factoryMock).toHaveBeenCalledTimes(1);
  });

  test('runs factory only twice in strict mode', () => {
    const factoryMock = jest.fn();
    const hook = renderHook(() => useSemanticMemo(factoryMock, []), { wrapper: StrictMode });

    hook.rerender();
    hook.rerender();
    hook.rerender();

    expect(factoryMock).toHaveBeenCalledTimes(2);
  });

  test('runs factory when deps are changed', () => {
    let dep = 1;
    const factoryMock = jest.fn();
    const hook = renderHook(() => useSemanticMemo(factoryMock, [dep]), { wrapper: StrictMode });

    expect(factoryMock).toHaveBeenCalledTimes(2);

    dep = 2;
    hook.rerender();

    expect(factoryMock).toHaveBeenCalledTimes(3);
  });
});
