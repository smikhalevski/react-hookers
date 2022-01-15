import {createContext} from 'react';
import {MetronomeManager} from './MetronomeManager';

/**
 * The context used by {@link useMetronome} to acquire the {@link Metronome} instances.
 */
export const MetronomeManagerContext = createContext(new MetronomeManager());

MetronomeManagerContext.displayName = 'MetronomeManagerContext';
