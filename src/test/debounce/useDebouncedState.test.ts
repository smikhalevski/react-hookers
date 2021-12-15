import {act, renderHook} from '@testing-library/react-hooks/native';
import {useDebouncedState} from '../../main';
import * as sleep from 'sleep-promise';

describe('useDebouncedState', () => {

  test('returns the same tuple and callback on every call', () => {
    const hook = renderHook(() => useDebouncedState(10));

    const protocol1 = hook.result.current;
    const [, , setState1] = protocol1;
    hook.rerender();

    const protocol2 = hook.result.current;
    const [, , setState2] = protocol1;

    expect(protocol1).toEqual(protocol2);
    expect(setState1).toEqual(setState2);
  });

  test('updates current state after the delay', async () => {
    const hookMock = jest.fn(() => useDebouncedState(10, 'AAA'));
    const hook = renderHook(hookMock);

    const [currState1, nextState1, setState] = hook.result.current;

    expect(hookMock).toHaveBeenCalledTimes(1);
    expect(currState1).toEqual('AAA');
    expect(nextState1).toEqual('AAA');

    act(() => setState('BBB'));

    const [currState2, nextState2] = hook.result.current;

    expect(hookMock).toHaveBeenCalledTimes(2);
    expect(currState2).toEqual('AAA');
    expect(nextState2).toEqual('BBB');

    await hook.waitForNextUpdate();

    const [currState3, nextState3] = hook.result.current;

    expect(hookMock).toHaveBeenCalledTimes(3);
    expect(currState3).toEqual('BBB');
    expect(nextState3).toEqual('BBB');
  });

  test('does not re-render if next state is unchanged', async () => {
    const hookMock = jest.fn(() => useDebouncedState(10, 'AAA'));
    const hook = renderHook(hookMock);

    const [, , setState] = hook.result.current;

    act(() => setState('AAA'));

    expect(hookMock).toHaveBeenCalledTimes(1);

    await sleep(100);

    expect(hookMock).toHaveBeenCalledTimes(1);
  });

  test('does not re-render if current state is unchanged', async () => {
    const hookMock = jest.fn(() => useDebouncedState(10, 'AAA'));
    const hook = renderHook(hookMock);

    const [, , setState] = hook.result.current;

    act(() => setState('BBB'));
    act(() => setState('AAA'));

    await sleep(100);

    expect(hookMock).toHaveBeenCalledTimes(3);
  });

  test('consequent sets cause the current state to be updated only once', async () => {
    const hookMock = jest.fn(() => useDebouncedState(10, 'AAA'));
    const hook = renderHook(hookMock);

    const [, , setState] = hook.result.current;

    act(() => setState('BBB'));
    act(() => setState('CCC'));

    await hook.waitForNextUpdate();

    const [currState] = hook.result.current;

    expect(currState).toEqual('CCC');
    expect(hookMock).toHaveBeenCalledTimes(4);
  });

  test('does not invoke the callback after unmount', async () => {
    const hook = renderHook(() => useDebouncedState(50, 'AAA'));

    const [, , setState] = hook.result.current;

    act(() => setState('BBB'));

    hook.unmount();

    await sleep(100);

    const [currState, nextState] = hook.result.current;

    expect(currState).toEqual('AAA');
    expect(nextState).toEqual('BBB');
  });
});
