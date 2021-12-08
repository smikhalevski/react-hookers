import {Checkpoint} from '../main/Checkpoint';
import {Executor} from '../main/Executor';
import AbortController, {AbortSignal} from 'node-abort-controller';
import * as sleep from 'sleep-promise';

global.AbortController = AbortController;
global.AbortSignal = AbortSignal;

describe('Checkpoint', () => {

  test('guard is a function', () => {
    const executor = new Executor(() => undefined);
    const checkpoint = new Checkpoint(executor, () => undefined);

    expect(checkpoint.guard(() => undefined)).toBeInstanceOf(Function);
  });

  test('invokes callback if condition is met', async () => {
    const listenerSpy = jest.fn();
    const conditionSpy = jest.fn(() => true);
    const fallbackSpy = jest.fn();
    const cbSpy = jest.fn();

    const executor = new Executor(listenerSpy);
    const checkpoint = new Checkpoint(executor, conditionSpy, fallbackSpy);
    const guardedCb = checkpoint.guard(cbSpy);

    guardedCb(123, 'abc');

    expect(checkpoint.pending).toBe(true);

    await sleep(50);

    expect(checkpoint.pending).toBe(false);

    expect(conditionSpy).toHaveBeenCalledTimes(1);
    expect(conditionSpy).toHaveBeenNthCalledWith(1, expect.any(AbortSignal));

    expect(fallbackSpy).not.toHaveBeenCalled();

    expect(cbSpy).toHaveBeenCalledTimes(1);
    expect(cbSpy).toHaveBeenNthCalledWith(1, 123, 'abc');

    expect(listenerSpy).toHaveBeenCalledTimes(2);
  });

  test('uses captured arguments when callback is called', async () => {
    const cbSpy = jest.fn((arg1: number, arg2: string) => undefined);
    const captureArgsSpy = jest.fn((): [number, string] => [456, 'def']);

    const executor = new Executor(() => undefined);
    const checkpoint = new Checkpoint(executor, () => true);
    const guardedCb = checkpoint.guard(cbSpy, captureArgsSpy);

    guardedCb(123, 'abc');

    await sleep(50);

    expect(captureArgsSpy).toHaveBeenCalledTimes(1);
    expect(captureArgsSpy).toHaveBeenNthCalledWith(1, 123, 'abc');

    expect(cbSpy).toHaveBeenCalledTimes(1);
    expect(cbSpy).toHaveBeenNthCalledWith(1, 456, 'def');
  });

  test('invokes fallback if condition is not met', async () => {
    const listenerSpy = jest.fn();
    const conditionSpy = jest.fn(() => false);
    const fallbackSpy = jest.fn();
    const cbSpy = jest.fn();

    const executor = new Executor(listenerSpy);
    const checkpoint = new Checkpoint(executor, conditionSpy, fallbackSpy);
    const guardedCb = checkpoint.guard(cbSpy);

    guardedCb(123, 'abc');

    expect(checkpoint.pending).toBe(true);

    await sleep(50);

    expect(checkpoint.pending).toBe(false);

    expect(conditionSpy).toHaveBeenCalledTimes(1);
    expect(conditionSpy).toHaveBeenNthCalledWith(1, expect.any(AbortSignal));

    expect(fallbackSpy).toHaveBeenCalledTimes(1);
    expect(fallbackSpy).toHaveBeenNthCalledWith(1, expect.any(Function));

    expect(cbSpy).not.toHaveBeenCalled();

    expect(listenerSpy).toHaveBeenCalledTimes(2);
  });

  test('replays the callback', async () => {
    let lastReplay: (() => void) | undefined;

    const listenerSpy = jest.fn();
    const conditionSpy = jest.fn(() => false);
    const fallbackSpy = jest.fn((replay) => lastReplay = replay);
    const cbSpy = jest.fn();

    const executor = new Executor(listenerSpy);
    const checkpoint = new Checkpoint(executor, conditionSpy, fallbackSpy);
    const guardedCb = checkpoint.guard(cbSpy);

    guardedCb(123, 'abc');

    await sleep(50);

    conditionSpy.mockImplementation(() => true);

    lastReplay?.();

    await sleep(50);

    expect(conditionSpy).toHaveBeenCalledTimes(2);
    expect(conditionSpy).toHaveBeenNthCalledWith(2, expect.any(AbortSignal));

    expect(fallbackSpy).toHaveBeenCalledTimes(1);
    expect(fallbackSpy).toHaveBeenNthCalledWith(1, expect.any(Function));

    expect(cbSpy).toHaveBeenCalledTimes(1);
    expect(cbSpy).toHaveBeenNthCalledWith(1, 123, 'abc');

    expect(listenerSpy).toHaveBeenCalledTimes(4);
  });

  test('uses captured arguments when callback is replayed', async () => {
    let lastReplay: (() => void) | undefined;

    const conditionSpy = jest.fn(() => false);
    const cbSpy = jest.fn((arg1: number, arg2: string) => undefined);
    const captureArgsSpy = jest.fn((): [number, string] => [456, 'def']);

    const executor = new Executor(() => undefined);
    const checkpoint = new Checkpoint(executor, conditionSpy, (replay) => lastReplay = replay);
    const guardedCb = checkpoint.guard(cbSpy, captureArgsSpy);

    guardedCb(123, 'abc');

    await sleep(50);

    expect(captureArgsSpy).toHaveBeenCalledTimes(1);
    expect(cbSpy).not.toHaveBeenCalled();

    conditionSpy.mockImplementation(() => true);

    lastReplay?.();

    await sleep(50);

    expect(captureArgsSpy).toHaveBeenCalledTimes(1);

    expect(cbSpy).toHaveBeenCalledTimes(1);
    expect(cbSpy).toHaveBeenNthCalledWith(1, 456, 'def');
  });

  test('aborts the pending condition check', async () => {
    let conditionSignal: AbortSignal | undefined;

    const listenerSpy = jest.fn();
    const conditionSpy = jest.fn(async (signal) => {
      conditionSignal = signal;
      await sleep(50);
      return true;
    });
    const fallbackSpy = jest.fn();
    const cbSpy = jest.fn();

    const executor = new Executor(listenerSpy);
    const checkpoint = new Checkpoint(executor, conditionSpy, fallbackSpy);

    const guardedCb = checkpoint.guard(cbSpy);

    guardedCb();

    expect(conditionSignal?.aborted).toBe(false);

    checkpoint.abort();

    expect(conditionSignal?.aborted).toBe(true);

    await sleep(50);

    expect(cbSpy).not.toHaveBeenCalled();
    expect(fallbackSpy).not.toHaveBeenCalled();
  });
});
