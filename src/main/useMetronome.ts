import { useContext } from 'react';
import { MetronomeProviderContext } from './MetronomeProviderContext';
import { Metronome } from './Metronome';

/**
 * Returns a {@link Metronome} instance. Use this to schedule callback invocation.
 *
 * @param ms The metronome interval duration in milliseconds.
 * @returns The {@link Metronome} instance.
 *
 * @see {@link useSchedule}
 */
export function useMetronome(ms: number): Metronome {
  return useContext(MetronomeProviderContext).getOrCreateMetronome(ms);
}
