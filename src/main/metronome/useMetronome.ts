import {useContext} from 'react';
import {MetronomeProviderContext} from './MetronomeProviderContext';
import {Metronome} from './Metronome';
import {useSemanticMemo} from '../memo';

/**
 * Returns a {@link Metronome} instance. Use this to schedule callback invocation.
 *
 * @param ms The metronome interval duration in milliseconds.
 * @returns The {@link Metronome} instance.
 *
 * @see {@link useSchedule}
 */
export function useMetronome(ms: number): Metronome {
  const provider = useContext(MetronomeProviderContext);
  return useSemanticMemo(() => provider.createMetronome(ms), [provider, ms]);
}
