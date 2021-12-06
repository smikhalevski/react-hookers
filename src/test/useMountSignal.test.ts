import AbortController, {AbortSignal} from 'node-abort-controller';
import {renderHook} from '@testing-library/react-hooks/native';
import {useMountSignal} from '../main';

global.AbortController = AbortController;
global.AbortSignal = AbortSignal;

describe('useMountSignal', () => {

  test('returns a tuple', () => {
    const hook = renderHook(() => useMountSignal());

    expect(hook.result.current).toEqual(new AbortSignal);
    expect(hook.result.current.aborted).toBe(false);
  });

  test('aborts when component is unmounted', () => {
    const hook = renderHook(() => useMountSignal());

    hook.unmount();

    expect(hook.result.current.aborted).toBe(true);
  });
});
