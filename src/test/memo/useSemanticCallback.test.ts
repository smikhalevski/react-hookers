import {renderHook} from '@testing-library/react-hooks/native';
import {useSemanticCallback} from '../../main';

describe('useSemanticCallback', () => {

  test('runs cb', () => {
    const cb = () => undefined;
    const hook = renderHook(() => useSemanticCallback(cb, undefined));

    expect(hook.result.current).toBe(cb);
  });

  test('returns the same cb', () => {
    const cb = () => undefined;
    const hook = renderHook(() => useSemanticCallback(cb, undefined));

    hook.rerender();
    expect(hook.result.current).toBe(cb);

    hook.rerender();
    expect(hook.result.current).toBe(cb);
  });

  test('updates cb when deps are changed', () => {
    let dep = 1;

    const cb1 = () => undefined;
    const cb2 = () => undefined;
    const cb3 = () => undefined;
    const cbProvider = jest.fn();

    cbProvider.mockReturnValueOnce(cb1);
    cbProvider.mockReturnValueOnce(cb2);
    cbProvider.mockReturnValueOnce(cb3);

    const hook = renderHook(() => useSemanticCallback(cbProvider(), [dep]));

    expect(hook.result.current).toBe(cb1);

    hook.rerender();
    expect(hook.result.current).toBe(cb1);

    dep = 2;
    hook.rerender();
    expect(hook.result.current).toBe(cb3);
  });
});
