import {act, renderHook} from '@testing-library/react-hooks/native';
import {useMetronome} from '../../main';
import * as sleep from 'sleep-promise';

describe('useMetronome', () => {

  test('returns same callbacks on every call', () => {
    const hook = renderHook(() => useMetronome());

    const [start1, stop1] = hook.result.current;
    hook.rerender();
    const [start2, stop2] = hook.result.current;

    hook.unmount();

    expect(start1).toEqual(start2);
    expect(stop1).toEqual(stop2);
  });

  test('invokes the callback', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useMetronome());

    const [start] = hook.result.current;

    act(() => start(cbMock, 50));

    await sleep(100);

    hook.unmount();

    expect(cbMock).toHaveBeenCalled();
  });

  test('consequent calls override the invoked callback', async () => {
    const cbMock1 = jest.fn();
    const cbMock2 = jest.fn();
    const hook = renderHook(() => useMetronome());

    const [start] = hook.result.current;

    act(() => start(cbMock1, 50));
    act(() => start(cbMock2, 50));

    await sleep(100);

    hook.unmount();

    expect(cbMock1).not.toHaveBeenCalled();
    expect(cbMock2).toHaveBeenCalled();
  });

  test('does not invoke the callback after unmount', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useMetronome());

    const [start] = hook.result.current;

    act(() => start(cbMock, 50));

    hook.unmount();

    await sleep(100);

    expect(cbMock).not.toHaveBeenCalled();
  });

  test('the callback invocation is canceled', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useMetronome());

    const [start, stop] = hook.result.current;

    act(() => start(cbMock, 50));

    act(() => stop());

    await sleep(100);

    hook.unmount();

    expect(cbMock).not.toHaveBeenCalled();
  });
});
