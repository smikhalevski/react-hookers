import {renderHook} from '@testing-library/react-hooks';
import {useMemo} from '../main/useMemo';

describe('useMemo', () => {

  test('runs factory invocation result', () => {
    const hook = renderHook(() => useMemo(() => 123, undefined));

    expect(hook.result.current).toBe(123);
  });

  test('runs factory only once', () => {
    const factoryMock = jest.fn();
    const hook = renderHook(() => useMemo(factoryMock, []));

    hook.rerender();
    hook.rerender();
    hook.rerender();

    expect(factoryMock).toHaveBeenCalledTimes(1);
  });

  test('runs factory when deps are changed', () => {
    let dep = 1;
    const factoryMock = jest.fn();
    const hook = renderHook(() => useMemo(factoryMock, [dep]));

    expect(factoryMock).toHaveBeenCalledTimes(1);

    dep = 2;
    hook.rerender();

    expect(factoryMock).toHaveBeenCalledTimes(2);
  });
});
