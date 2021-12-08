import {renderHook} from '@testing-library/react-hooks/native';
import {useRenderEffect} from '../main/useRenderEffect';

describe('useRenderEffect', () => {

  test('calls the effect synchronously', () => {
    const fn = jest.fn();

    renderHook(() => {
      useRenderEffect(() => fn(1));
      fn(2);
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 1);
    expect(fn).toHaveBeenNthCalledWith(2, 2);
  });

  test('invokes the dispose function on unmount', () => {
    const disposeMock = jest.fn();
    const hook = renderHook(() => useRenderEffect(() => disposeMock, []));

    hook.unmount();

    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  test('invokes the dispose function on re-render', () => {
    const disposeMock = jest.fn();
    const hook = renderHook(() => useRenderEffect(() => disposeMock));

    hook.rerender();
    hook.rerender();

    expect(disposeMock).toHaveBeenCalledTimes(2);
  });

  test('does not invoke the effect if deps did not change', () => {
    const effectMock = jest.fn();
    const hook = renderHook(() => useRenderEffect(effectMock, [1]));

    hook.rerender();

    expect(effectMock).toHaveBeenCalledTimes(1);
  });

  test('invokes the effect when deps change', () => {
    let dep = 1;

    const effectMock = jest.fn();
    const hook = renderHook(() => useRenderEffect(effectMock, [dep]));

    dep = 2;
    hook.rerender();

    expect(effectMock).toHaveBeenCalledTimes(2);
  });

  test('invokes the dispose function when deps change', () => {
    let dep = 1;

    const disposeMock = jest.fn();
    const hook = renderHook(() => useRenderEffect(() => disposeMock, [dep]));

    dep = 2;
    hook.rerender();

    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  test('invokes the last passed dispose function on unmount', () => {
    const disposeMock1 = jest.fn();
    const disposeMock2 = jest.fn();

    const effectMock = jest.fn();
    effectMock.mockReturnValueOnce(disposeMock1);
    effectMock.mockReturnValueOnce(disposeMock2);

    const hook = renderHook(() => useRenderEffect(effectMock));

    hook.rerender();
    hook.unmount();

    expect(disposeMock1).toHaveBeenCalledTimes(1);
    expect(disposeMock2).toHaveBeenCalledTimes(1);
  });

});
