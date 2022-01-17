import {act, renderHook} from '@testing-library/react-hooks/native';
import {useSchedule} from '../../main';
import * as sleep from 'sleep-promise';

describe('useSchedule', () => {

  test('returns same callbacks on every call', () => {
    const hook = renderHook(() => useSchedule());

    const [schedule1, cancel1] = hook.result.current;
    hook.rerender();
    const [schedule2, cancel2] = hook.result.current;

    hook.unmount();

    expect(schedule1).toBe(schedule2);
    expect(cancel1).toBe(cancel2);
  });

  test('invokes the callback', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useSchedule());

    const [schedule] = hook.result.current;

    act(() => schedule(cbMock, 50));

    await sleep(100);

    hook.unmount();

    expect(cbMock).toHaveBeenCalled();
  });

  test('consequent calls override the invoked callback', async () => {
    const cbMock1 = jest.fn();
    const cbMock2 = jest.fn();
    const hook = renderHook(() => useSchedule());

    const [schedule] = hook.result.current;

    act(() => schedule(cbMock1, 50));
    act(() => schedule(cbMock2, 50));

    await sleep(100);

    hook.unmount();

    expect(cbMock1).not.toHaveBeenCalled();
    expect(cbMock2).toHaveBeenCalled();
  });

  test('does not invoke the callback after unmount', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useSchedule());

    const [schedule] = hook.result.current;

    act(() => schedule(cbMock, 50));

    hook.unmount();

    await sleep(100);

    expect(cbMock).not.toHaveBeenCalled();
  });

  test('the callback invocation is canceled', async () => {
    const cbMock = jest.fn();
    const hook = renderHook(() => useSchedule());

    const [schedule, cancel] = hook.result.current;

    act(() => schedule(cbMock, 50));
    act(() => cancel());

    await sleep(100);

    hook.unmount();

    expect(cbMock).not.toHaveBeenCalled();
  });
});
