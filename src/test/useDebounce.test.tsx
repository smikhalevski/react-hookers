import React from 'react';
import {act, renderHook} from '@testing-library/react-hooks';
import {useDebounce} from '../main/useDebounce';

describe('useDebounce', () => {

  test('returns the same callback on every call', () => {
    const hook = renderHook(() => useDebounce());

    const [debounce1, cancel1] = hook.result.current;
    hook.rerender();
    const [debounce2, cancel2] = hook.result.current;

    expect(debounce1).toEqual(debounce2);
    expect(cancel1).toEqual(cancel2);
  });

  test('invokes the callback', (done) => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useDebounce());

    act(() => hook.result.current[0](cbMock, 50));

    setTimeout(() => {
      expect(cbMock).toHaveBeenCalled();
      done();
    }, 100);
  });

  test('the consequent calls override the invoked callback', (done) => {
    const cbMock1 = jest.fn();
    const cbMock2 = jest.fn();
    const hook = renderHook(() => useDebounce());

    act(() => hook.result.current[0](cbMock1, 50));
    act(() => hook.result.current[0](cbMock2, 50));

    setTimeout(() => {
      expect(cbMock1).not.toHaveBeenCalled();
      expect(cbMock2).toHaveBeenCalled();
      done();
    }, 100);
  });

  test('does not invoke the callback after unmount', (done) => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useDebounce());

    act(() => hook.result.current[0](cbMock, 50));

    hook.unmount();

    setTimeout(() => {
      expect(cbMock).not.toHaveBeenCalled();
      done();
    }, 100);
  });

  test('the callback invocation is canceled', (done) => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useDebounce());

    act(() => hook.result.current[0](cbMock, 50));

    act(() => hook.result.current[1]());

    setTimeout(() => {
      expect(cbMock).not.toHaveBeenCalled();
      done();
    }, 100);
  });
});
