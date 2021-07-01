import AbortController from 'node-abort-controller';
import {createExecutor} from '../main/createExecutor';

global.AbortController = AbortController;

describe('createExecutor', () => {

  it('creates a blank executor', () => {
    const listenerMock = jest.fn();
    const executor = createExecutor(listenerMock);

    expect(listenerMock).not.toHaveBeenCalled();
    expect(executor.disposed).toBe(false);
    expect(executor.pending).toBe(false);
    expect(executor.resolved).toBe(false);
    expect(executor.rejected).toBe(false);
    expect(executor.result).toBe(undefined);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(undefined);
  });

  it('creates an executor with initial result', () => {
    const listenerMock = jest.fn();
    const executor = createExecutor(listenerMock, 123);

    expect(listenerMock).not.toHaveBeenCalled();
    expect(executor.disposed).toBe(false);
    expect(executor.pending).toBe(false);
    expect(executor.resolved).toBe(true);
    expect(executor.rejected).toBe(false);
    expect(executor.result).toBe(123);
    expect(executor.reason).toBe(undefined);
    expect(executor.promise).toBe(undefined);
  });

  it('invokes callback', async () => {
    const listenerMock = jest.fn();
    const executor = createExecutor(listenerMock);

    const cbMock = jest.fn();
    await executor.execute(cbMock);

    expect(cbMock).toHaveBeenCalledTimes(1);
  });

  // it('executes sync resolve', () => {
  //   const executor = createExecutor(listenerMock);
  //   executor.execute(() => 123);
  //
  //   expect(executor.pending).toBe(false);
  //   expect(executor.resolved).toBe(true);
  //   expect(executor.rejected).toBe(false);
  //   expect(executor.result).toBe(123);
  //   expect(executor.reason).toBe(undefined);
  // });
  //
  // it('executes sync reject', () => {
  //   const executor = createExecutor(listenerMock);
  //   const err = new Error();
  //   executor.execute(() => {
  //     throw err;
  //   });
  //
  //   expect(executor.pending).toBe(false);
  //   expect(executor.resolved).toBe(false);
  //   expect(executor.rejected).toBe(true);
  //   expect(executor.result).toBe(undefined);
  //   expect(executor.reason).toBe(err);
  // });
  //
  // it('notifies subscribers about sync resolve', () => {
  //   const executor = createExecutor(listenerMock);
  //   const l = jest.fn();
  //
  //   executor.subscribe(l);
  //   expect(l).toHaveBeenCalledTimes(0);
  //
  //   executor.execute(() => 123);
  //   expect(l).toHaveBeenCalledTimes(1);
  // });
  //
  // it('notifies subscribers about sync reject', () => {
  //   const executor = createExecutor(listenerMock);
  //   const err = new Error();
  //   const l = jest.fn();
  //
  //   executor.subscribe(l);
  //   expect(l).toHaveBeenCalledTimes(0);
  //
  //   executor.execute(() => {
  //     throw err;
  //   });
  //   expect(l).toHaveBeenCalledTimes(1);
  // });
  //
  // it('marks pending on async execute', async () => {
  //   const executor = createExecutor(listenerMock);
  //   executor.execute(() => Promise.resolve(123));
  //
  //   expect(executor.pending).toBe(true);
  //   expect(executor.resolved).toBe(false);
  //   expect(executor.rejected).toBe(false);
  //   expect(executor.result).toBe(undefined);
  //   expect(executor.reason).toBe(undefined);
  // });
  //
  // it('executes async resolve', async () => {
  //   const executor = createExecutor(listenerMock);
  //   executor.execute(() => Promise.resolve(123));
  //
  //   await Promise.resolve();
  //   expect(executor.pending).toBe(false);
  //   expect(executor.resolved).toBe(true);
  //   expect(executor.rejected).toBe(false);
  //   expect(executor.result).toBe(123);
  //   expect(executor.reason).toBe(undefined);
  // });
  //
  // it('executes async reject', async () => {
  //   const executor = createExecutor(listenerMock);
  //   const err = new Error();
  //   executor.execute(async () => {
  //     throw err;
  //   });
  //
  //   await Promise.resolve();
  //   expect(executor.pending).toBe(false);
  //   expect(executor.resolved).toBe(false);
  //   expect(executor.rejected).toBe(true);
  //   expect(executor.result).toBe(undefined);
  //   expect(executor.reason).toBe(err);
  // });
  //
  // it('notifies subscribers about async resolve', async () => {
  //   const executor = createExecutor(listenerMock);
  //   const l = jest.fn();
  //
  //   executor.subscribe(l);
  //   expect(l).toHaveBeenCalledTimes(0);
  //
  //   executor.execute(() => Promise.resolve(123));
  //   expect(l).toHaveBeenCalledTimes(1);
  //
  //   await Promise.resolve();
  //   expect(l).toHaveBeenCalledTimes(2);
  // });
  //
  // it('notifies subscribers about async reject', async () => {
  //   const executor = createExecutor(listenerMock);
  //   const err = new Error();
  //   const l = jest.fn();
  //
  //   executor.subscribe(l);
  //   expect(l).toHaveBeenCalledTimes(0);
  //
  //   executor.execute(async () => {
  //     throw err;
  //   });
  //   expect(l).toHaveBeenCalledTimes(1);
  //
  //   await Promise.resolve();
  //   expect(l).toHaveBeenCalledTimes(2);
  // });
  //
  // it('aborts pending execution when a new callback is executed', (done) => {
  //   const executor = createExecutor(listenerMock);
  //   const p1: ExecutorCallback<any> = jest.fn(async (signal) => {
  //     await Promise.resolve();
  //     expect(signal.aborted).toBe(true);
  //     done();
  //   });
  //   const p2 = jest.fn(() => undefined);
  //
  //   executor.execute(p1);
  //   executor.execute(p2);
  // });
  //
  // it('resolves with given result', () => {
  //   const executor = createExecutor(listenerMock);
  //   executor.resolve(123);
  //
  //   expect(executor.pending).toBe(false);
  //   expect(executor.resolved).toBe(true);
  //   expect(executor.rejected).toBe(false);
  //   expect(executor.result).toBe(123);
  //   expect(executor.reason).toBe(undefined);
  // });
  //
  // it('rejects with given reason', () => {
  //   const executor = createExecutor(listenerMock);
  //   const err = new Error();
  //   executor.reject(err);
  //
  //   expect(executor.pending).toBe(false);
  //   expect(executor.resolved).toBe(false);
  //   expect(executor.rejected).toBe(true);
  //   expect(executor.result).toBe(undefined);
  //   expect(executor.reason).toBe(err);
  // });
  //
  // it('stores only last result or reason', () => {
  //   const executor = createExecutor(listenerMock);
  //   const err = new Error();
  //   executor.resolve(123);
  //   executor.reject(err);
  //
  //   expect(executor.pending).toBe(false);
  //   expect(executor.resolved).toBe(false);
  //   expect(executor.rejected).toBe(true);
  //   expect(executor.result).toBe(undefined);
  //   expect(executor.reason).toBe(err);
  // });
  //
  // it('clears current result without abortion of pending executor', async () => {
  //   const executor = createExecutor(listenerMock);
  //   executor.resolve(444);
  //   executor.execute(() => Promise.resolve(111));
  //   executor.clear();
  //
  //   expect(executor.pending).toBe(true);
  //   expect(executor.resolved).toBe(false);
  //   expect(executor.rejected).toBe(false);
  //   expect(executor.result).toBe(undefined);
  //   expect(executor.reason).toBe(undefined);
  //
  //   await Promise.resolve();
  //
  //   expect(executor.pending).toBe(false);
  //   expect(executor.resolved).toBe(true);
  //   expect(executor.rejected).toBe(false);
  //   expect(executor.result).toBe(111);
  //   expect(executor.reason).toBe(undefined);
  // });
});
