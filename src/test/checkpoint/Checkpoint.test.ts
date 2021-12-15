import {Checkpoint, Executor} from '../../main';
import * as sleep from 'sleep-promise';

describe('Checkpoint', () => {

  test('guard is a function', () => {
    const executor = new Executor(() => undefined);
    const checkpoint = new Checkpoint(executor, () => undefined);

    expect(checkpoint.guard(() => undefined)).toBeInstanceOf(Function);
  });

  test('invokes callback if condition is met', async () => {
    const listenerMock = jest.fn();
    const conditionMock = jest.fn(() => true);
    const fallbackMock = jest.fn();
    const cbMock = jest.fn();

    const executor = new Executor(listenerMock);
    const checkpoint = new Checkpoint(executor, conditionMock, fallbackMock);
    const guardedCb = checkpoint.guard(cbMock);

    guardedCb(123, 'abc');

    expect(checkpoint.pending).toBe(true);

    await sleep(50);

    expect(checkpoint.pending).toBe(false);

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

    const executor = new Executor(() => undefined);
    const checkpoint = new Checkpoint(executor, () => true);
    const guardedCb = checkpoint.guard(cbMock, captureArgsMock);

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

    const executor = new Executor(listenerMock);
    const checkpoint = new Checkpoint(executor, conditionMock, fallbackMock);
    const guardedCb = checkpoint.guard(cbMock);

    guardedCb(123, 'abc');

    expect(checkpoint.pending).toBe(true);

    await sleep(50);

    expect(checkpoint.pending).toBe(false);

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

    const executor = new Executor(listenerMock);
    const checkpoint = new Checkpoint(executor, conditionMock, fallbackMock);
    const guardedCb = checkpoint.guard(cbMock);

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

    const executor = new Executor(() => undefined);
    const checkpoint = new Checkpoint(executor, conditionMock, (replay) => lastReplay = replay);
    const guardedCb = checkpoint.guard(cbMock, captureArgsMock);

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

    const listenerMock = jest.fn();
    const conditionMock = jest.fn(async (signal) => {
      conditionSignal = signal;
      await sleep(50);
      return true;
    });
    const fallbackMock = jest.fn();
    const cbMock = jest.fn();

    const executor = new Executor(listenerMock);
    const checkpoint = new Checkpoint(executor, conditionMock, fallbackMock);

    const guardedCb = checkpoint.guard(cbMock);

    guardedCb();

    expect(conditionSignal?.aborted).toBe(false);

    checkpoint.abort();

    expect(conditionSignal?.aborted).toBe(true);

    await sleep(50);

    expect(cbMock).not.toHaveBeenCalled();
    expect(fallbackMock).not.toHaveBeenCalled();
  });
});
