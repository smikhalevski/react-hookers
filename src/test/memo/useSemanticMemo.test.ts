import { renderHook } from '@testing-library/react';
import { useSemanticMemo } from '../../main';

describe('useSemanticMemo', () => {
  test('runs factory invocation result', () => {
    const hook = renderHook(() => useSemanticMemo(() => 123, undefined));

    expect(hook.result.current).toBe(123);
  });

  test('runs factory only once', () => {
    const factoryMock = jest.fn();
    const hook = renderHook(() => useSemanticMemo(factoryMock, []));

    hook.rerender();
    hook.rerender();
    hook.rerender();

    expect(factoryMock).toHaveBeenCalledTimes(1);
  });

  test('runs factory when deps are changed', () => {
    let dep = 1;
    const factoryMock = jest.fn();
    const hook = renderHook(() => useSemanticMemo(factoryMock, [dep]));

    expect(factoryMock).toHaveBeenCalledTimes(1);

    dep = 2;
    hook.rerender();

    expect(factoryMock).toHaveBeenCalledTimes(2);
  });
});
