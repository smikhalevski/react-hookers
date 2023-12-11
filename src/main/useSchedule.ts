import { EffectCallback, useContext } from 'react';
import { MetronomeProvider } from './MetronomeProvider';
import { MetronomeProviderContext } from './MetronomeProviderContext';
import { SetTimeout } from './types';
import { noop } from './utils';
import { useInsertionEffect } from './useInsertionEffect';
import { useSemanticMemo } from './useSemanticMemo';

/**
 * The replacement for `setInterval` that is cancelled when component is unmounted. Schedules a function to be
 * repeatedly called with a fixed time delay between each call.
 *
 * All functions that were scheduled with the same delay are invoked synchronously.
 *
 * @see {@link useRerenderSchedule}
 */
export function useSchedule(): [schedule: SetTimeout, cancel: () => void] {
  const provider = useContext(MetronomeProviderContext);
  const manager = useSemanticMemo(() => createScheduleManager(provider), [provider]);

  useInsertionEffect(manager.effect);

  return [manager.schedule, manager.cancel];
}

function createScheduleManager(provider: MetronomeProvider) {
  let _schedule: <A extends any[]>(cb: (...args: A) => void, ms: number, args: A) => void = noop;
  let _cancel = noop;

  const effect: EffectCallback = () => {
    let abort: (() => void) | undefined;

    _schedule = (cb, ms, args) => {
      _cancel();

      abort = provider.getOrCreateMetronome(ms).schedule(() => {
        cb(...args);
      });
    };

    _cancel = () => {
      abort?.();
      abort = undefined;
    };

    return () => {
      _cancel();
      _schedule = _cancel = noop;
    };
  };

  const schedule: SetTimeout = (cb, ms = 0, ...args) => {
    _schedule(cb, ms, args);
  };

  return {
    effect,
    schedule,
    cancel() {
      _cancel();
    },
  };
}
