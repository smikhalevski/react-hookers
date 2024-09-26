import { Lock } from 'parallel-universe';
import { EffectCallback, useEffect, useState } from 'react';
import { useFunction } from './useFunction';
import { emptyArray, noop } from './utils';

/**
 * Promise-based [lock implementation](https://github.com/smikhalevski/parallel-universe#lock).
 *
 * When someone tries to acquire a lock using `acquire` they receive a promise for a release callback that is fulfilled
 * as soon as previous lock owner invokes their release callback. If `acquire` is called after unmount then the returned
 * promise is never fulfilled.
 */
export function useLock(): [isLocked: boolean, acquire: () => Promise<() => void>] {
  const [isLocked, setLocked] = useState(false);
  const manager = useFunction(createLockManager, setLocked);

  useEffect(manager.effect, emptyArray);

  return [isLocked, manager.acquire];
}

function createLockManager(setLocked: (isLocked: boolean) => void) {
  const lock = new Lock();

  const acquire = () => {
    setLocked(true);

    return lock.acquire().then(release => () => {
      release();
      setLocked(lock.isLocked);
    });
  };

  let doAcquire = acquire;

  const effect: EffectCallback = () => {
    doAcquire = acquire;

    return () => {
      doAcquire = () => new Promise(noop);
    };
  };

  return {
    effect,
    acquire: () => doAcquire(),
  };
}
