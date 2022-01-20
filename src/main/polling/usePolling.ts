import {Executor, ExecutorCallback, useExecutor} from '../executor';
import {Metronome, useMetronome} from '../metronome';
import {EffectCallback, useEffect} from 'react';
import {useSemanticMemo} from '../memo';

export type PollingProtocol<T> = [executor: Executor<T>, start: (cb: ExecutorCallback<T>) => void, stop: () => void];

export function usePolling<T = unknown>(ms: number, initialValue?: ExecutorCallback<T> | T): Readonly<PollingProtocol<T>> {
  const metronome = useMetronome(ms);
  const executor = useExecutor<T>(initialValue);
  const manager = useSemanticMemo(() => createPollManager(metronome, executor), [metronome, executor]);

  useEffect(manager.__effect, [manager]);

  return manager.__protocol;
}

function createPollManager<T>(metronome: Metronome, executor: Executor<T>) {

  let cleanup: (() => void) | undefined;

  const start = (cb: ExecutorCallback<T>) => {
    stop();
    cleanup = metronome.schedule(() => {
      if (!executor.pending) {
        executor.execute(cb);
      }
    });
  };

  const stop = () => {
    executor.abort();
    cleanup?.();
    cleanup = undefined;
  };

  const __effect: EffectCallback = () => stop;

  return {
    __effect,
    __protocol: [executor, start, stop] as const,
  };
}
