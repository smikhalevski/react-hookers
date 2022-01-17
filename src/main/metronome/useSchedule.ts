import {useContext} from 'react';
import {useSemanticMemo} from '../memo';
import {MetronomeProvider} from './MetronomeProvider';
import {MetronomeProviderContext} from './MetronomeProviderContext';
import {SetTimeout} from '../shared-types';
import {useEffectOnce} from '../effect';

export type ScheduleProtocol = [schedule: SetTimeout, cancel: () => void];

/**
 * The replacement for `setInterval` that is cancelled when component is unmounted. Schedules a function to be
 * repeatedly called with a fixed time delay between each call.
 *
 * All functions that were scheduled with the same delay are invoked synchronously.
 *
 * @see {@link useRerenderSchedule}
 */
export function useSchedule(): Readonly<ScheduleProtocol> {
  const provider = useContext(MetronomeProviderContext);
  const manager = useSemanticMemo(() => createScheduleManager(provider), [provider]);

  useEffectOnce(manager._effect);

  return manager._protocol;
}

function createScheduleManager(provider: MetronomeProvider) {

  let cleanup: (() => void) | undefined;

  const schedule: SetTimeout = (cb, ms = 0, ...args) => {
    cancel();
    cleanup = provider.getMetronome(ms).schedule(args.length === 0 ? cb : () => {
      cb(...args);
    });
  };

  const cancel = () => {
    cleanup?.();
    cleanup = undefined;
  };

  const _effect = () => cancel;

  return {
    _effect,
    _protocol: [schedule, cancel] as const,
  };
}
