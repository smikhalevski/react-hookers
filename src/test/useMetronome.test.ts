import { renderHook } from '@testing-library/react';
import { Metronome, useMetronome } from '../main';
import { StrictMode } from 'react';

describe('useMetronome', () => {
  test('returns the Metronome instance', () => {
    const hook = renderHook(() => useMetronome(500), { wrapper: StrictMode });

    expect(hook.result.current).toBeInstanceOf(Metronome);
  });

  test('returns same metronome on every call', () => {
    const hook = renderHook(() => useMetronome(500), { wrapper: StrictMode });

    const metronome1 = hook.result.current;
    hook.rerender();
    const metronome2 = hook.result.current;

    hook.unmount();

    expect(metronome1).toBe(metronome2);
  });
});
