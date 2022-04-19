import {act, renderHook} from '@testing-library/react-hooks/native';
import {sleep} from 'parallel-universe';
import {usePrecondition} from '../../main';

describe('usePrecondition', () => {

  test('returns a protocol', () => {
    const hook = renderHook(() => usePrecondition(() => true));

    expect(hook.result.current[0]).toBeInstanceOf(Function);
    expect(hook.result.current[1]).toBe(false);
    expect(hook.result.current[2]).toBeInstanceOf(Function);
  });

  test('re-renders after condition check', async () => {
    const setPendingSpy = jest.fn();

    const hook = renderHook(() => {
      const precondition = usePrecondition(async () => {
        await sleep(50);
        return true;
      });
      setPendingSpy(precondition[1]);
      return precondition;
    });

    expect(setPendingSpy).toHaveBeenCalledTimes(1);
    expect(setPendingSpy).toHaveBeenNthCalledWith(1, false);

    const protectedCb = hook.result.current[0](() => undefined);

    act(() => protectedCb());

    expect(setPendingSpy).toHaveBeenCalledTimes(2);
    expect(setPendingSpy).toHaveBeenNthCalledWith(2, true);

    await hook.waitForNextUpdate();

    expect(setPendingSpy).toHaveBeenCalledTimes(3);
    expect(setPendingSpy).toHaveBeenNthCalledWith(3, false);
  });

  test('re-renders after replay', async () => {
    let lastReplay: (() => void) | undefined;

    const checkMock = jest.fn(async () => {
      await sleep(50);
      return false;
    });
    const hookMock = jest.fn(() => usePrecondition(checkMock, (replay) => lastReplay = replay));
    const hook = renderHook(hookMock);

    const protectedCb = hook.result.current[0](() => undefined);

    act(() => protectedCb());

    await hook.waitForNextUpdate(); // condition not met

    checkMock.mockImplementation(async () => {
      await sleep(50);
      return true;
    });
    act(() => lastReplay?.());

    await hook.waitForNextUpdate(); // condition met

    expect(hookMock).toHaveBeenCalledTimes(5);
  });

  test('updates check and fallback', async () => {
    const checkMock1 = jest.fn();
    const checkMock2 = jest.fn();
    const fallbackMock1 = jest.fn();
    const fallbackMock2 = jest.fn();

    let check = checkMock1;
    let fallback = fallbackMock1;

    const hook = renderHook(() => usePrecondition(check, fallback));

    const protectedCb = hook.result.current[0](() => undefined);
    act(() => protectedCb());
    await hook.waitForNextUpdate();

    expect(checkMock1).toHaveBeenCalledTimes(1);
    expect(fallbackMock1).toHaveBeenCalledTimes(1);

    // apply new condition and fallback
    check = checkMock2;
    fallback = fallbackMock2;
    hook.rerender();

    act(() => protectedCb());
    await hook.waitForNextUpdate();

    expect(checkMock1).toHaveBeenCalledTimes(1);
    expect(fallbackMock1).toHaveBeenCalledTimes(1);
    expect(checkMock2).toHaveBeenCalledTimes(1);
    expect(fallbackMock2).toHaveBeenCalledTimes(1);
  });
});
