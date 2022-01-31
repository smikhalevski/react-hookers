import {Guard} from '../../main';
import {Executor} from 'parallel-universe';
import * as sleep from 'sleep-promise';

describe('Guard', () => {

  test('returns a function', () => {
    const executor = new Executor();
    const guard = new Guard(executor, () => undefined);

    expect(guard.guardCallback(() => undefined)).toBeInstanceOf(Function);
  });

  test('invokes callback if condition is met', async () => {
    const listenerMock = jest.fn();
    const conditionMock = jest.fn(() => true);
    const fallbackMock = jest.fn();
    const cbMock = jest.fn();

    const executor = new Executor();
    executor.subscribe(listenerMock);

    const guard = new Guard(executor, conditionMock, fallbackMock);
    const guardedCb = guard.guardCallback(cbMock);

    guardedCb(123, 'abc');

    expect(guard.pending).toBe(true);

    await sleep(50);

    expect(guard.pending).toBe(false);

    expect(conditionMock).toHaveBeenCalledTimes(1);
    expect(conditionMock).toHaveBeenNthCalledWith(1, expect.any(AbortSignal));

    expect(fallbackMock).not.toHaveBeenCalled();

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 123, 'abc');

    expect(listenerMock).toHaveBeenCalledTimes(2);
  });

  test('uses captured arguments when callback is called', async () => {
    const cbMock = jest.fn((arg1: number, arg2: string) => arg1 + arg2);
    const captureArgsMock = jest.fn((): [number, string] => [456, 'def']);

    const executor = new Executor();
    const guard = new Guard(executor, () => true);
    const guardedCb = guard.guardCallback(cbMock, captureArgsMock);

    guardedCb(123, 'abc');

    await sleep(50);

    expect(captureArgsMock).toHaveBeenCalledTimes(1);
    expect(captureArgsMock).toHaveBeenNthCalledWith(1, 123, 'abc');

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 456, 'def');
  });

  test('invokes fallback if condition is not met', async () => {
    const listenerMock = jest.fn();
    const conditionMock = jest.fn(() => false);
    const fallbackMock = jest.fn();
    const cbMock = jest.fn();

    const executor = new Executor();
    executor.subscribe(listenerMock);

    const guard = new Guard(executor, conditionMock, fallbackMock);
    const guardedCb = guard.guardCallback(cbMock);

    guardedCb(123, 'abc');

    expect(guard.pending).toBe(true);

    await sleep(50);

    expect(guard.pending).toBe(false);

    expect(conditionMock).toHaveBeenCalledTimes(1);
    expect(conditionMock).toHaveBeenNthCalledWith(1, expect.any(AbortSignal));

    expect(fallbackMock).toHaveBeenCalledTimes(1);
    expect(fallbackMock).toHaveBeenNthCalledWith(1, expect.any(Function));

    expect(cbMock).not.toHaveBeenCalled();

    expect(listenerMock).toHaveBeenCalledTimes(2);
  });

  test('replays the callback', async () => {
    let lastReplay: (() => void) | undefined;

    const listenerMock = jest.fn();
    const conditionMock = jest.fn(() => false);
    const fallbackMock = jest.fn((replay) => lastReplay = replay);
    const cbMock = jest.fn();

    const executor = new Executor();
    executor.subscribe(listenerMock);

    const guard = new Guard(executor, conditionMock, fallbackMock);
    const guardedCb = guard.guardCallback(cbMock);

    guardedCb(123, 'abc');

    await sleep(50);

    conditionMock.mockImplementation(() => true);

    lastReplay?.();

    await sleep(50);

    expect(conditionMock).toHaveBeenCalledTimes(2);
    expect(conditionMock).toHaveBeenNthCalledWith(2, expect.any(AbortSignal));

    expect(fallbackMock).toHaveBeenCalledTimes(1);
    expect(fallbackMock).toHaveBeenNthCalledWith(1, expect.any(Function));

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 123, 'abc');

    expect(listenerMock).toHaveBeenCalledTimes(4);
  });

  test('uses captured arguments when callback is replayed', async () => {
    let lastReplay: (() => void) | undefined;

    const conditionMock = jest.fn(() => false);
    const cbMock = jest.fn((arg1: number, arg2: string) => arg1 + arg2);
    const captureArgsMock = jest.fn((): [number, string] => [456, 'def']);

    const executor = new Executor();
    const guard = new Guard(executor, conditionMock, (replay) => lastReplay = replay);
    const guardedCb = guard.guardCallback(cbMock, captureArgsMock);

    guardedCb(123, 'abc');

    await sleep(50);

    expect(captureArgsMock).toHaveBeenCalledTimes(1);
    expect(cbMock).not.toHaveBeenCalled();

    conditionMock.mockImplementation(() => true);

    lastReplay?.();

    await sleep(50);

    expect(captureArgsMock).toHaveBeenCalledTimes(1);

    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 456, 'def');
  });

  test('aborts the pending condition check', async () => {
    let conditionSignal: AbortSignal | undefined;

    const conditionMock = jest.fn(async (signal) => {
      conditionSignal = signal;
      await sleep(50);
      return true;
    });
    const fallbackMock = jest.fn();
    const cbMock = jest.fn();

    const executor = new Executor();
    const guard = new Guard(executor, conditionMock, fallbackMock);

    const guardedCb = guard.guardCallback(cbMock);

    guardedCb();

    expect(conditionSignal?.aborted).toBe(false);

    guard.abort();

    expect(conditionSignal?.aborted).toBe(true);

    await sleep(50);

    expect(cbMock).not.toHaveBeenCalled();
    expect(fallbackMock).not.toHaveBeenCalled();
  });
});
