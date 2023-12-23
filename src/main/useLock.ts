import { Lock } from 'parallel-universe';
import { EffectCallback, useRef, useState } from 'react';
import { useInsertionEffect } from './useInsertionEffect';
import { emptyDeps, noop } from './utils';

/**
 * Promise-based [lock implementation](https://github.com/smikhalevski/parallel-universe#lock).
 *
 * When someone tries to acquire a lock using `acquire` they receive a promise for a release callback that is fulfilled
 * as soon as previous lock owner invokes their release callback.
 */
export function useLock(): [isLocked: boolean, acquire: () => Promise<() => void>] {
  const [isLocked, setLocked] = useState(false);
  const manager = (useRef<ReturnType<typeof createLockManager>>().current ||= createLockManager(setLocked));

  useInsertionEffect(manager.effect, emptyDeps);

  return [isLocked, manager.acquire];
}

function createLockManager(setLocked: (isLocked: boolean) => void) {
  const lock = new Lock();

  const acquire = lock.acquire.bind(lock);

  let doAcquire = acquire;

  const effect: EffectCallback = () => {
    doAcquire = acquire;

    const unsubscribe = lock.subscribe(() => {
      setLocked(lock.isLocked);
    });

    return () => {
      doAcquire = () => new Promise(noop);
      unsubscribe();
    };
  };

  return {
    effect,
    acquire: () => doAcquire(),
  };
}
