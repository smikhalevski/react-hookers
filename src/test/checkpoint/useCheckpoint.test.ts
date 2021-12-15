import {act, renderHook} from '@testing-library/react-hooks/native';
import {Checkpoint, useCheckpoint} from '../../main';
import * as sleep from 'sleep-promise';

describe('useCheckpoint', () => {

  test('returns a Checkpoint instance', () => {
    const hook = renderHook(() => useCheckpoint(() => true));

    expect(hook.result.current).toBeInstanceOf(Checkpoint);
    expect(hook.result.current.pending).toBe(false);
  });

  test('re-renders after condition check', async () => {
    const setPendingMock = jest.fn();

    const hook = renderHook(() => {
      const checkpoint = useCheckpoint(async () => {
        await sleep(50);
        return true;
      });
      setPendingMock(checkpoint.pending);
      return checkpoint;
    });

    expect(setPendingMock).toHaveBeenCalledTimes(1);
    expect(setPendingMock).toHaveBeenNthCalledWith(1, false);

    const guardedCb = hook.result.current.guard(() => undefined);

    act(() => guardedCb());

    expect(setPendingMock).toHaveBeenCalledTimes(2);
    expect(setPendingMock).toHaveBeenNthCalledWith(2, true);

    await hook.waitForNextUpdate();

    expect(setPendingMock).toHaveBeenCalledTimes(3);
    expect(setPendingMock).toHaveBeenNthCalledWith(3, false);
  });

  test('re-renders after replay', async () => {
    let lastReplay: (() => void) | undefined;

    const conditionMock = jest.fn(async () => {
      await sleep(50);
      return false;
    });
    const hookMock = jest.fn(() => useCheckpoint(conditionMock, (replay) => lastReplay = replay));
    const hook = renderHook(hookMock);

    const guardedCb = hook.result.current.guard(() => undefined);

    act(() => guardedCb());

    await hook.waitForNextUpdate(); // condition not met

    conditionMock.mockImplementation(async () => {
      await sleep(50);
      return true;
    });
    act(() => lastReplay?.());

    await hook.waitForNextUpdate(); // condition met

    expect(hookMock).toHaveBeenCalledTimes(5);
  });

  test('updates condition and fallback', async () => {
    const conditionMock1 = jest.fn();
    const conditionMock2 = jest.fn();
    const fallbackMock1 = jest.fn();
    const fallbackMock2 = jest.fn();

    let condition = conditionMock1;
    let fallback = fallbackMock1;

    const hook = renderHook(() => useCheckpoint(condition, fallback));

    const guardedCb = hook.result.current.guard(() => undefined);
    act(() => guardedCb());
    await hook.waitForNextUpdate();

    expect(conditionMock1).toHaveBeenCalledTimes(1);
    expect(fallbackMock1).toHaveBeenCalledTimes(1);

    // apply new condition and fallback
    condition = conditionMock2;
    fallback = fallbackMock2;
    hook.rerender();

    act(() => guardedCb());
    await hook.waitForNextUpdate();

    expect(conditionMock1).toHaveBeenCalledTimes(1);
    expect(fallbackMock1).toHaveBeenCalledTimes(1);
    expect(conditionMock2).toHaveBeenCalledTimes(1);
    expect(fallbackMock2).toHaveBeenCalledTimes(1);
  });
});
