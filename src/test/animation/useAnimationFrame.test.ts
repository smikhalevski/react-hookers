import { act, renderHook } from '@testing-library/react';
import { sleep } from 'parallel-universe';
import { useAnimationFrame } from '../../main';

global.requestAnimationFrame = cb => setTimeout(cb, 0);

global.cancelAnimationFrame = handle => clearTimeout(handle);

describe('useAnimationFrame', () => {
  test('returns same callbacks on every call', () => {
    const hook = renderHook(() => useAnimationFrame());

    const [start1, stop1] = hook.result.current;
    hook.rerender();
    const [start2, stop2] = hook.result.current;

    hook.unmount();

    expect(start1).toBe(start2);
    expect(stop1).toBe(stop2);
  });

  test('invokes the callback', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useAnimationFrame());

    const [start] = hook.result.current;

    act(() => start(cbMock));

    await sleep(10);

    hook.unmount();

    expect(cbMock).toHaveBeenCalled();
  });

  test('consequent calls override the invoked callback', async () => {
    const cbMock1 = jest.fn();
    const cbMock2 = jest.fn();
    const hook = renderHook(() => useAnimationFrame());

    const [start] = hook.result.current;

    act(() => start(cbMock1));
    act(() => start(cbMock2));

    await sleep(100);

    hook.unmount();

    expect(cbMock1).not.toHaveBeenCalled();
    expect(cbMock2).toHaveBeenCalled();
  });

  test('does not invoke the callback after unmount', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useAnimationFrame());

    const [start] = hook.result.current;

    act(() => start(cbMock));

    hook.unmount();

    await sleep(100);

    expect(cbMock).not.toHaveBeenCalled();
  });

  test('the callback invocation is canceled', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useAnimationFrame());

    const [start, stop] = hook.result.current;

    act(() => start(cbMock));

    act(() => stop());

    await sleep(100);

    hook.unmount();

    expect(cbMock).not.toHaveBeenCalled();
  });
});
