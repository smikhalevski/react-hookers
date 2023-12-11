import { renderHook } from '@testing-library/react';
import { useRefCallback } from '../main';
import { StrictMode } from 'react';

describe('useRefCallback', () => {
  test('returns a tuple', () => {
    const hook = renderHook(() => useRefCallback(111), { wrapper: StrictMode });

    expect(hook.result.current).toEqual([{ current: 111 }, expect.any(Function)]);
  });

  test('returns the same accessor on every render', () => {
    const useRefCallbackMock = jest.fn(useRefCallback);
    const hook = renderHook(() => useRefCallbackMock(), { wrapper: StrictMode });
    const refCallback = hook.result.current[1];

    hook.rerender();

    expect(useRefCallbackMock).toHaveBeenCalledTimes(4);
    expect(hook.result.current[1]).toBe(refCallback);
  });

  test('current is undefined by default', () => {
    const hook = renderHook(() => useRefCallback(), { wrapper: StrictMode });

    expect(hook.result.current[0].current).toBe(undefined);
  });

  test('updates the ref current value with setter', () => {
    const hook = renderHook(() => useRefCallback('aaa'), { wrapper: StrictMode });

    expect(hook.result.current[0].current).toBe('aaa');

    hook.result.current[1]('bbb');

    expect(hook.result.current[0].current).toBe('bbb');
  });
});
