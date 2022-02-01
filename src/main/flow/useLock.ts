import {useRef} from 'react';
import {useRerender} from '../render';
import {Lock} from 'parallel-universe';
import {useEffectOnce} from '../effect';

/**
 * Returns the `Lock` instance that can be used to synchronize async processes.
 */
export function useLock(): Lock {
  const rerender = useRerender();
  const lock = useRef<Lock>().current ||= new Lock();

  useEffectOnce(() => lock.subscribe(rerender));

  return lock;
}
