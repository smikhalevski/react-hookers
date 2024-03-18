import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { useAsyncEffect } from '../main';

jest.useFakeTimers();

describe('useAsyncEffect', () => {
  test('calls the effect after mount in non-strict mode', () => {
    const fn = jest.fn();

    renderHook(() => {
      useAsyncEffect(() => fn(1), undefined);
      fn(2);
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 2);
    expect(fn).toHaveBeenNthCalledWith(2, 1);
  });

  test('calls the effect after mount in strict mode', () => {
    const fn = jest.fn();

    renderHook(
      () => {
        useAsyncEffect(() => fn(1), undefined);
        fn(2);
      },
      { wrapper: StrictMode }
    );

    expect(fn).toHaveBeenCalledTimes(4);
    expect(fn).toHaveBeenNthCalledWith(1, 2);
    expect(fn).toHaveBeenNthCalledWith(2, 2);
    expect(fn).toHaveBeenNthCalledWith(3, 1);
    expect(fn).toHaveBeenNthCalledWith(4, 1);
  });

  test('invokes the dispose function on unmount', async () => {
    const disposeMock = jest.fn();
    const hook = renderHook(() => useAsyncEffect(() => Promise.resolve(disposeMock), []), { wrapper: StrictMode });

    await act(() => jest.runAllTimersAsync());

    hook.unmount();

    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  test('invokes the dispose function on re-render', async () => {
    const disposeMock = jest.fn();
    const hook = renderHook(() => useAsyncEffect(() => Promise.resolve(disposeMock), undefined), {
      wrapper: StrictMode,
    });

    await act(() => jest.runAllTimersAsync());

    hook.rerender();

    await act(() => jest.runAllTimersAsync());

    hook.rerender();

    expect(disposeMock).toHaveBeenCalledTimes(2);
  });

  test('invokes the async dispose function on re-render', async () => {
    const disposeMock = jest.fn();
    const hook = renderHook(() => useAsyncEffect(() => Promise.resolve(disposeMock), undefined), {
      wrapper: StrictMode,
    });

    await jest.runAllTimersAsync();
    hook.rerender();

    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  test('does not invoke the effect if deps did not change', () => {
    const effectMock = jest.fn();
    const hook = renderHook(() => useAsyncEffect(effectMock, [1]), { wrapper: StrictMode });

    hook.rerender();

    expect(effectMock).toHaveBeenCalledTimes(2);
  });

  test('invokes the effect when deps change', () => {
    const effectMock = jest.fn();
    const hook = renderHook(deps => useAsyncEffect(effectMock, deps), { wrapper: StrictMode, initialProps: [111] });

    hook.rerender([222]);

    expect(effectMock).toHaveBeenCalledTimes(3);
  });

  test('invokes the async dispose function when deps change', async () => {
    const disposeMock = jest.fn();
    const hook = renderHook(deps => useAsyncEffect(() => Promise.resolve(disposeMock), deps), {
      wrapper: StrictMode,
      initialProps: [111],
    });

    await jest.runAllTimersAsync();
    hook.rerender([222]);

    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  test('passes a signal to the effect callback', () => {
    const effectMock = jest.fn();
    renderHook(() => useAsyncEffect(effectMock, undefined), { wrapper: StrictMode });

    expect(effectMock).toHaveBeenCalledTimes(2);
    expect(effectMock).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  test('aborts the signal if the previous effect is pending', () => {
    const signals: AbortSignal[] = [];

    const hook = renderHook(
      () =>
        useAsyncEffect(signal => {
          signals.push(signal);
          return Promise.resolve();
        }, undefined),
      { wrapper: StrictMode }
    );

    hook.rerender();

    expect(signals.length).toBe(3);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(true);
    expect(signals[2].aborted).toBe(false);
  });

  test('does not abort the signal if the previous effect is fulfilled', async () => {
    const signals: AbortSignal[] = [];

    const hook = renderHook(
      () =>
        useAsyncEffect(signal => {
          signals.push(signal);
          return Promise.resolve();
        }, undefined),
      { wrapper: StrictMode }
    );

    await jest.runAllTimersAsync();
    hook.rerender();

    expect(signals.length).toBe(3);
    expect(signals[0].aborted).toBe(true); // Aborted because of the strict mode
    expect(signals[1].aborted).toBe(false);
    expect(signals[2].aborted).toBe(false);
  });
});
