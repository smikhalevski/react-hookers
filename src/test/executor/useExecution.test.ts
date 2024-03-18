import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { useExecution } from '../../main';

describe('useExecution', () => {
  test('creates a execution', async () => {
    const hook = renderHook(() => useExecution('xxx', () => 'aaa'), { wrapper: StrictMode });

    const execution1 = hook.result.current;
    expect(execution1.isPending).toBe(true);
    expect(execution1.isFulfilled).toBe(false);
    expect(execution1.isRejected).toBe(false);
    expect(execution1.value).toBe(undefined);
    expect(execution1.reason).toBe(undefined);
    expect(execution1.promise).toBeInstanceOf(Promise);

    await act(() => execution1.promise);

    const execution2 = hook.result.current;
    expect(execution2.isPending).toBe(false);
    expect(execution2.isFulfilled).toBe(true);
    expect(execution2.isRejected).toBe(false);
    expect(execution2.value).toBe('aaa');
    expect(execution2.reason).toBe(undefined);
    expect(execution2.promise).toBe(null);
  });

  // test('repeats the execution if deps were changed', () => {
  //   const cbMock = jest.fn(() => 'foo');
  //   const hookMock = jest.fn(deps => useExecution('xxx', cbMock, deps));
  //
  //   const hook = renderHook(hookMock, { wrapper: StrictMode, initialProps: [111] });
  //
  //   expect(cbMock).toHaveBeenCalledTimes(2);
  //   expect(hookMock).toHaveBeenCalledTimes(2);
  //   expect(hook.result.current.value).toBe('foo');
  //
  //   hook.rerender([111]);
  //
  //   expect(cbMock).toHaveBeenCalledTimes(2);
  //   expect(hookMock).toHaveBeenCalledTimes(4);
  //   expect(hook.result.current.value).toBe('foo');
  //
  //   cbMock.mockImplementation(() => 'bar');
  //   hook.rerender([222]);
  //
  //   expect(cbMock).toHaveBeenCalledTimes(3);
  //   expect(hookMock).toHaveBeenCalledTimes(8);
  //   expect(hook.result.current.value).toBe('bar');
  // });
});
