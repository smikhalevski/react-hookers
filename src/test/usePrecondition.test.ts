import { act, renderHook } from '@testing-library/react';
import { usePrecondition } from '../main';
import { StrictMode } from 'react';

describe('usePrecondition', () => {
  test('returns a protocol', () => {
    const hook = renderHook(() => usePrecondition(() => true), { wrapper: StrictMode });

    expect(hook.result.current[0]).toBeInstanceOf(Function);
    expect(hook.result.current[1]).toBe(false);
    expect(hook.result.current[2]).toBeInstanceOf(Function);
  });

  test('re-renders after condition check', async () => {
    const setPendingSpy = jest.fn();

    const hook = renderHook(
      () => {
        const precondition = usePrecondition(() => Promise.resolve(true));
        setPendingSpy(precondition[1]);
        return precondition;
      },
      { wrapper: StrictMode }
    );

    expect(setPendingSpy).toHaveBeenCalledTimes(2);
    expect(setPendingSpy).toHaveBeenNthCalledWith(1, false);
    expect(setPendingSpy).toHaveBeenNthCalledWith(2, false);

    const protectedCb = hook.result.current[0](() => undefined);

    const promise = act(() => protectedCb());

    expect(setPendingSpy).toHaveBeenCalledTimes(4);
    expect(setPendingSpy).toHaveBeenNthCalledWith(3, true);
    expect(setPendingSpy).toHaveBeenNthCalledWith(4, true);

    await promise;

    expect(setPendingSpy).toHaveBeenCalledTimes(6);
    expect(setPendingSpy).toHaveBeenNthCalledWith(5, false);
    expect(setPendingSpy).toHaveBeenNthCalledWith(6, false);
  });

  test('re-renders after replay', async () => {
    let lastReplay: (() => void) | undefined;

    const checkMock = jest.fn(() => Promise.resolve(false));
    const hookMock = jest.fn(() =>
      usePrecondition(checkMock, replay => {
        lastReplay = replay;
      })
    );
    const hook = renderHook(hookMock, { wrapper: StrictMode });

    const protectedCb = hook.result.current[0](() => undefined);

    await act(() => protectedCb());

    checkMock.mockImplementation(() => Promise.resolve(true));

    await act(() => lastReplay!());

    expect(hookMock).toHaveBeenCalledTimes(10);
  });

  test('updates check and fallback', async () => {
    const checkMock1 = jest.fn();
    const checkMock2 = jest.fn();
    const fallbackMock1 = jest.fn();
    const fallbackMock2 = jest.fn();

    let check = checkMock1;
    let fallback = fallbackMock1;

    const hook = renderHook(() => usePrecondition(check, fallback), { wrapper: StrictMode });

    const protectedCb = hook.result.current[0](() => undefined);
    await act(() => protectedCb());

    expect(checkMock1).toHaveBeenCalledTimes(1);
    expect(fallbackMock1).toHaveBeenCalledTimes(1);

    // apply new condition and fallback
    check = checkMock2;
    fallback = fallbackMock2;
    hook.rerender();

    await act(() => protectedCb());

    expect(checkMock1).toHaveBeenCalledTimes(1);
    expect(fallbackMock1).toHaveBeenCalledTimes(1);
    expect(checkMock2).toHaveBeenCalledTimes(1);
    expect(fallbackMock2).toHaveBeenCalledTimes(1);
  });
  //
  // test('returns a function', () => {
  //   const executor = new Executor();
  //   const guard = new WithPrecondition(executor, () => undefined);
  //
  //   expect(guard.guardCallback(() => undefined)).toBeInstanceOf(Function);
  // });
  //
  // test('invokes callback if condition is met', async () => {
  //   const listenerMock = jest.fn();
  //   const conditionMock = jest.fn(() => true);
  //   const fallbackMock = jest.fn();
  //   const cbMock = jest.fn();
  //
  //   const executor = new Executor();
  //   executor.subscribe(listenerMock);
  //
  //   const guard = new WithPrecondition(executor, conditionMock, fallbackMock);
  //   const guardedCb = guard.guardCallback(cbMock);
  //
  //   guardedCb(111, 'aaa');
  //
  //   expect(guard.executor.pending).toBe(true);
  //
  //   await sleep(50);
  //
  //   expect(guard.executor.pending).toBe(false);
  //
  //   expect(conditionMock).toHaveBeenCalledTimes(1);
  //   expect(conditionMock).toHaveBeenNthCalledWith(1, expect.any(AbortSignal));
  //
  //   expect(fallbackMock).not.toHaveBeenCalled();
  //
  //   expect(cbMock).toHaveBeenCalledTimes(1);
  //   expect(cbMock).toHaveBeenNthCalledWith(1, 111, 'aaa');
  //
  //   expect(listenerMock).toHaveBeenCalledTimes(2);
  // });
  //
  // test('uses captured arguments when callback is called', async () => {
  //   const cbMock = jest.fn((arg1: number, arg2: string) => arg1 + arg2);
  //   const captureArgsMock = jest.fn((): [number, string] => [222, 'bbb']);
  //
  //   const executor = new Executor();
  //   const guard = new WithPrecondition(executor, () => true);
  //   const guardedCb = guard.guardCallback(cbMock, captureArgsMock);
  //
  //   guardedCb(111, 'aaa');
  //
  //   await sleep(50);
  //
  //   expect(captureArgsMock).toHaveBeenCalledTimes(1);
  //   expect(captureArgsMock).toHaveBeenNthCalledWith(1, 111, 'aaa');
  //
  //   expect(cbMock).toHaveBeenCalledTimes(1);
  //   expect(cbMock).toHaveBeenNthCalledWith(1, 222, 'bbb');
  // });
  //
  // test('invokes fallback if condition is not met', async () => {
  //   const listenerMock = jest.fn();
  //   const conditionMock = jest.fn(() => false);
  //   const fallbackMock = jest.fn();
  //   const cbMock = jest.fn();
  //
  //   const executor = new Executor();
  //   executor.subscribe(listenerMock);
  //
  //   const guard = new WithPrecondition(executor, conditionMock, fallbackMock);
  //   const guardedCb = guard.guardCallback(cbMock);
  //
  //   guardedCb(111, 'aaa');
  //
  //   expect(guard.executor.pending).toBe(true);
  //
  //   await sleep(50);
  //
  //   expect(guard.executor.pending).toBe(false);
  //
  //   expect(conditionMock).toHaveBeenCalledTimes(1);
  //   expect(conditionMock).toHaveBeenNthCalledWith(1, expect.any(AbortSignal));
  //
  //   expect(fallbackMock).toHaveBeenCalledTimes(1);
  //   expect(fallbackMock).toHaveBeenNthCalledWith(1, expect.any(Function));
  //
  //   expect(cbMock).not.toHaveBeenCalled();
  //
  //   expect(listenerMock).toHaveBeenCalledTimes(2);
  // });
  //
  // test('replays the callback', async () => {
  //   let lastReplay: (() => void) | undefined;
  //
  //   const listenerMock = jest.fn();
  //   const conditionMock = jest.fn(() => false);
  //   const fallbackMock = jest.fn((replay) => lastReplay = replay);
  //   const cbMock = jest.fn();
  //
  //   const executor = new Executor();
  //   executor.subscribe(listenerMock);
  //
  //   const guard = new WithPrecondition(executor, conditionMock, fallbackMock);
  //   const guardedCb = guard.guardCallback(cbMock);
  //
  //   guardedCb(111, 'aaa');
  //
  //   await sleep(50);
  //
  //   conditionMock.mockImplementation(() => true);
  //
  //   lastReplay?.();
  //
  //   await sleep(50);
  //
  //   expect(conditionMock).toHaveBeenCalledTimes(2);
  //   expect(conditionMock).toHaveBeenNthCalledWith(2, expect.any(AbortSignal));
  //
  //   expect(fallbackMock).toHaveBeenCalledTimes(1);
  //   expect(fallbackMock).toHaveBeenNthCalledWith(1, expect.any(Function));
  //
  //   expect(cbMock).toHaveBeenCalledTimes(1);
  //   expect(cbMock).toHaveBeenNthCalledWith(1, 111, 'aaa');
  //
  //   expect(listenerMock).toHaveBeenCalledTimes(4);
  // });
  //
  // test('uses captured arguments when callback is replayed', async () => {
  //   let lastReplay: (() => void) | undefined;
  //
  //   const conditionMock = jest.fn(() => false);
  //   const cbMock = jest.fn((arg1: number, arg2: string) => arg1 + arg2);
  //   const captureArgsMock = jest.fn((): [number, string] => [222, 'bbb']);
  //
  //   const executor = new Executor();
  //   const guard = new WithPrecondition(executor, conditionMock, (replay) => lastReplay = replay);
  //   const guardedCb = guard.guardCallback(cbMock, captureArgsMock);
  //
  //   guardedCb(111, 'aaa');
  //
  //   await sleep(50);
  //
  //   expect(captureArgsMock).toHaveBeenCalledTimes(1);
  //   expect(cbMock).not.toHaveBeenCalled();
  //
  //   conditionMock.mockImplementation(() => true);
  //
  //   lastReplay?.();
  //
  //   await sleep(50);
  //
  //   expect(captureArgsMock).toHaveBeenCalledTimes(1);
  //
  //   expect(cbMock).toHaveBeenCalledTimes(1);
  //   expect(cbMock).toHaveBeenNthCalledWith(1, 222, 'bbb');
  // });

  // test('aborts the pending condition check', async () => {
  //   let conditionSignal: AbortSignal | undefined;
  //
  //   const conditionMock = jest.fn(signal => {
  //     conditionSignal = signal;
  //     return Promise.resolve(true);
  //   });
  //   const fallbackMock = jest.fn();
  //   const cbMock = jest.fn();
  //
  //   const executor = new Executor();
  //   const guard = new WithPrecondition(executor, conditionMock, fallbackMock);
  //
  //   const guardedCb = guard.guardCallback(cbMock);
  //
  //   guardedCb();
  //
  //   expect(conditionSignal?.aborted).toBe(false);
  //
  //   guard.executor.abort();
  //
  //   expect(conditionSignal?.aborted).toBe(true);
  //
  //   await sleep(50);
  //
  //   expect(cbMock).not.toHaveBeenCalled();
  //   expect(fallbackMock).not.toHaveBeenCalled();
  // });
});