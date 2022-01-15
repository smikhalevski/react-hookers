import {useContext} from 'react';
import {useSemanticMemo} from '../memo';
import {MetronomeManager} from './MetronomeManager';
import {MetronomeManagerContext} from './MetronomeManagerContext';
import {SetTimeout} from '../shared-types';

export type MetronomeProtocol = [start: SetTimeout, stop: () => void];

/**
 * Schedules a function to be repeatedly called with a fixed time delay between each call.
 *
 * All functions that were scheduled with the same delay are invoked synchronously.
 *
 * ```ts
 * const [start, stop] = useMetronome();
 *
 * useEffect(() => start(() => {
 *   // Called every 500 milliseconds
 * }, 500), []);
 * ```
 *
 * @see {@link useRerenderMetronome}
 */
export function useMetronome(): Readonly<MetronomeProtocol> {
  const manager = useContext(MetronomeManagerContext);
  return useSemanticMemo(() => createMetronomeProtocol(manager), [manager]);
}

function createMetronomeProtocol(manager: MetronomeManager) {

  let cleanup: (() => void) | undefined;

  const start: SetTimeout = (cb, ms = 0, ...args) => {
    stop();

    const metronome = manager.getMetronome(ms);

    const callback = () => {
      cb(...args);
    };
    metronome.add(callback);

    cleanup = () => {
      metronome.remove(callback);
    };
  };

  const stop = () => {
    cleanup?.();
  };

  return [start, stop] as const;
}
