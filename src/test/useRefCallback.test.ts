import {renderHook} from '@testing-library/react-hooks/native';
import {useRefCallback} from '../main/useRefCallback';

describe('useRefCallback', () => {

  test('returns a tuple', () => {
    const hook = renderHook(() => useRefCallback(123));

    expect(hook.result.current).toEqual([
      {current: 123},
      expect.any(Function),
    ]);
  });

  test('returns the same accessor on every render', () => {
    const useRefCallbackSpy = jest.fn(useRefCallback);
    const hook = renderHook(() => useRefCallbackSpy());
    const accessor = hook.result.current;

    hook.rerender();

    expect(useRefCallbackSpy).toHaveBeenCalledTimes(2);
    expect(hook.result.current).toBe(accessor);
  });

  test('current is undefined by default', () => {
    const hook = renderHook(() => useRefCallback());

    expect(hook.result.current[0].current).toBe(undefined);
  });

  test('updates the ref current value with setter', () => {
    const hook = renderHook(() => useRefCallback('abc'));

    expect(hook.result.current[0].current).toBe('abc');

    hook.result.current[1]('def');

    expect(hook.result.current[0].current).toBe('def');
  });
});
