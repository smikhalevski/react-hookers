import {Execution, Executor, ExecutorCallback} from './Executor';
import {Metronome, useMetronome} from '../metronome';
import {useExecutor} from './useExecutor';
import {useEffect} from 'react';
import {useSemanticMemo} from '../memo';

export type PollProtocol<T> = [execution: Execution<T>, poll: (cb: ExecutorCallback<T>) => void, abort: () => void];

export function usePoll<T = unknown>(ms: number, initialValue?: ExecutorCallback<T> | T): Readonly<PollProtocol<T>> {
  const metronome = useMetronome(ms);
  const executor = useExecutor<T>(initialValue);
  const manager = useSemanticMemo(() => createPollManager(metronome, executor), [metronome, executor]);

  useEffect(manager._effect, [manager]);

  return manager._protocol;
}

function createPollManager<T>(metronome: Metronome, executor: Executor<T>) {

  let cancel: (() => void) | undefined;

  const poll = (cb: ExecutorCallback<T>) => {
    cancel = metronome.schedule(() => {
      if (!executor.pending) {
        executor.execute(cb);
      }
    });
  };

  const abort = () => {
    executor.abort();
    cancel?.();
    cancel = undefined;
  };

  const _effect = () => abort;

  return {
    _effect,
    _protocol: [executor, poll, abort] as const,
  };
}
