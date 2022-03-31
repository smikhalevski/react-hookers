import {Lock} from 'parallel-universe';
import {EffectCallback, useRef} from 'react';
import {useEffectOnce} from '../effect';
import {useRerender} from '../render';

export type LockProtocol = [locked: boolean, acquire: () => Promise<() => void>];

/**
 * Returns the `Lock` instance that can be used to synchronize async processes.
 */
export function useLock(): Readonly<LockProtocol> {
  const rerender = useRerender();
  const manager = useRef<ReturnType<typeof createLockManager>>().current ||= createLockManager(rerender);

  useEffectOnce(manager.__effect);

  return manager.__protocol;
}

export function createLockManager(rerender: () => void) {

  const lock = new Lock();

  const __effect: EffectCallback = () => lock.subscribe(() => {
    __protocol[0] = lock.locked;
    rerender();
  });

  const __protocol: LockProtocol = [false, lock.acquire.bind(lock)];

  return {
    __effect,
    __protocol,
  };
}
