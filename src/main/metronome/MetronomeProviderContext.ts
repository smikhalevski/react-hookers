import {createContext} from 'react';
import {MetronomeProvider} from './MetronomeProvider';

/**
 * The context used by {@link useMetronome} to acquire the {@link Metronome} instances.
 */
export const MetronomeProviderContext = createContext(new MetronomeProvider());

MetronomeProviderContext.displayName = 'MetronomeProviderContext';
