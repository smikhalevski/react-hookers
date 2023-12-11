import { renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { useMountSignalRef } from '../main';

describe('useMountSignalRef', () => {
  test('returns a tuple', () => {
    const hook = renderHook(() => useMountSignalRef(), { wrapper: StrictMode });

    expect(hook.result.current.current).toBeInstanceOf(AbortSignal);
    expect(hook.result.current.current.aborted).toBe(false);
  });

  test('aborts when component is unmounted', () => {
    const hook = renderHook(() => useMountSignalRef(), { wrapper: StrictMode });

    hook.unmount();

    expect(hook.result.current.current.aborted).toBe(true);
  });
});
