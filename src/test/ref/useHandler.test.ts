import {renderHook} from '@testing-library/react-hooks/native';
import {useHandler} from '../../main';

describe('useHandler', () => {

  test('returns function', () => {
    const hook = renderHook(() => useHandler(() => 123));

    expect(hook.result.current).toEqual(expect.any(Function));
  });

  test('returns the same function on each render', () => {
    const hook = renderHook(() => useHandler(() => 123));
    const fn = hook.result.current;

    hook.rerender();

    expect(hook.result.current).toBe(fn);
  });

  test('returned function replicated the handler signature', () => {
    const hook = renderHook(() => useHandler((a, b) => a * 2 + b));

    expect(hook.result.current(3, 4)).toBe(10);
  });
});
