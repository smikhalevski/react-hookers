import {renderHook} from '@testing-library/react-hooks/native';
import {useMountSignal} from '../../main';

describe('useMountSignal', () => {

  test('returns a tuple', () => {
    const hook = renderHook(() => useMountSignal());

    expect(hook.result.current).toBeInstanceOf(AbortSignal);
    expect(hook.result.current.aborted).toBe(false);
  });

  test('aborts when component is unmounted', () => {
    const hook = renderHook(() => useMountSignal());

    hook.unmount();

    expect(hook.result.current.aborted).toBe(true);
  });
});
