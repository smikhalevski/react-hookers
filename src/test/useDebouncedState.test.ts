import { act, renderHook } from '@testing-library/react';
import { useDebouncedState } from '../main';
import { StrictMode } from 'react';

jest.useFakeTimers();

describe('useDebouncedState', () => {
  test('returns a new array instance on each render', () => {
    const hook = renderHook(() => useDebouncedState(10), { wrapper: StrictMode });
    const protocol = hook.result.current;

    hook.rerender();

    expect(hook.result.current).not.toBe(protocol);
  });

  test('returns the same callback on every call', () => {
    const hook = renderHook(() => useDebouncedState(10), { wrapper: StrictMode });

    const setState1 = hook.result.current[2];
    hook.rerender();

    const setState2 = hook.result.current[2];

    expect(setState1).toBe(setState2);
  });

  test('updates current state after the delay', async () => {
    const hookMock = jest.fn(() => useDebouncedState(10, 'aaa'));

    const hook = renderHook(hookMock, { wrapper: StrictMode });

    const [currState1, nextState1, setState] = hook.result.current;

    expect(hookMock).toHaveBeenCalledTimes(2);
    expect(currState1).toBe('aaa');
    expect(nextState1).toBe('aaa');

    act(() => setState('bbb'));

    const [currState2, nextState2] = hook.result.current;

    expect(hookMock).toHaveBeenCalledTimes(6);
    expect(currState2).toBe('aaa');
    expect(nextState2).toBe('bbb');

    act(() => jest.runOnlyPendingTimers());

    const [currState3, nextState3] = hook.result.current;

    expect(hookMock).toHaveBeenCalledTimes(8);
    expect(currState3).toBe('bbb');
    expect(nextState3).toBe('bbb');
  });

  test('does not re-render if next state is unchanged', async () => {
    const hookMock = jest.fn(() => useDebouncedState(10, 'aaa'));
    const hook = renderHook(hookMock, { wrapper: StrictMode });

    const [, , setState] = hook.result.current;

    act(() => setState('aaa'));

    expect(hookMock).toHaveBeenCalledTimes(2);

    act(() => jest.runOnlyPendingTimers());

    expect(hookMock).toHaveBeenCalledTimes(2);
  });

  test('does not re-render if current state is unchanged', async () => {
    const hookMock = jest.fn(() => useDebouncedState(10, 'aaa'));
    const hook = renderHook(hookMock, { wrapper: StrictMode });

    const [, , setState] = hook.result.current;

    act(() => setState('bbb'));
    act(() => setState('aaa'));

    act(() => jest.runOnlyPendingTimers());

    expect(hookMock).toHaveBeenCalledTimes(10);
  });

  test('consequent sets cause the current state to be updated only once', async () => {
    const hookMock = jest.fn(() => useDebouncedState(10, 'aaa'));
    const hook = renderHook(hookMock, { wrapper: StrictMode });

    const [, , setState] = hook.result.current;

    act(() => setState('bbb'));
    act(() => setState('ccc'));

    act(() => jest.runOnlyPendingTimers());

    const [currState] = hook.result.current;

    expect(currState).toBe('ccc');
    expect(hookMock).toHaveBeenCalledTimes(10);
  });

  test('does not invoke the callback after unmount', async () => {
    const hook = renderHook(() => useDebouncedState(50, 'aaa'), { wrapper: StrictMode });

    const [, , setState] = hook.result.current;

    act(() => setState('bbb'));

    hook.unmount();

    act(() => jest.runOnlyPendingTimers());

    const [currState, nextState] = hook.result.current;

    expect(currState).toBe('aaa');
    expect(nextState).toBe('bbb');
  });
});
