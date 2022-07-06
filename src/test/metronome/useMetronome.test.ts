import { renderHook } from '@testing-library/react-hooks/native';
import { Metronome, useMetronome } from '../../main';

describe('useMetronome', () => {
  test('returns the Metronome instance', () => {
    const hook = renderHook(() => useMetronome(500));

    expect(hook.result.current).toBeInstanceOf(Metronome);
  });

  test('returns same metronome on every call', () => {
    const hook = renderHook(() => useMetronome(500));

    const metronome1 = hook.result.current;
    hook.rerender();
    const metronome2 = hook.result.current;

    hook.unmount();

    expect(metronome1).toBe(metronome2);
  });
});
