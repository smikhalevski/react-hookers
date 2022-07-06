import { act, renderHook } from '@testing-library/react';
import { sleep } from 'parallel-universe';
import { useDebounce } from '../../main';

describe('useDebounce', () => {
  test('returns same callbacks on every call', () => {
    const hook = renderHook(() => useDebounce());

    const [debounce1, cancel1] = hook.result.current;
    hook.rerender();
    const [debounce2, cancel2] = hook.result.current;

    expect(debounce1).toBe(debounce2);
    expect(cancel1).toBe(cancel2);
  });

  test('invokes the callback', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useDebounce());

    const [debounce] = hook.result.current;

    act(() => debounce(cbMock, 50));

    await sleep(100);

    expect(cbMock).toHaveBeenCalled();
  });

  test('consequent calls override the invoked callback', async () => {
    const cbMock1 = jest.fn();
    const cbMock2 = jest.fn();
    const hook = renderHook(() => useDebounce());

    const [debounce] = hook.result.current;

    act(() => debounce(cbMock1, 50));
    act(() => debounce(cbMock2, 50));

    await sleep(100);

    expect(cbMock1).not.toHaveBeenCalled();
    expect(cbMock2).toHaveBeenCalled();
  });

  test('does not invoke the callback after unmount', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useDebounce());

    const [debounce] = hook.result.current;

    act(() => debounce(cbMock, 50));

    hook.unmount();

    await sleep(100);

    expect(cbMock).not.toHaveBeenCalled();
  });

  test('the callback invocation is canceled', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useDebounce());

    const [debounce, cancel] = hook.result.current;

    act(() => debounce(cbMock, 50));

    act(() => cancel());

    await sleep(100);

    expect(cbMock).not.toHaveBeenCalled();
  });
});
