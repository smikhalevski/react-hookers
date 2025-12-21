import { Lock } from 'parallel-universe';
import { EffectCallback, useLayoutEffect, useState } from 'react';
import { useFunctionOnce } from './useFunctionOnce.js';
import { emptyArray, noop } from './utils/lang.js';

/**
 * Promise-based [lock implementation](https://github.com/smikhalevski/parallel-universe#lock).
 *
 * When someone tries to acquire the lock using `acquire`, they receive a promise for a release callback. The promise
 * is fulfilled as soon as the previous lock owner invokes their release callback. If `acquire` is called after the
 * component is unmounted, the returned promise is never fulfilled.
 *
 * @example
 * const [isLocked, acquire] = useLock();
 *
 * async function doSomething() {
 *   const release = await acquire();
 *   try {
 *     // Long process starts here
 *   } finally {
 *     release();
 *   }
 * }
 *
 * // The long process will be executed three times sequentially
 * doSomething();
 * doSomething();
 * doSomething();
 *
 * @group Other
 */
export function useLock(): [isLocked: boolean, acquire: () => Promise<() => void>] {
  const [isLocked, setLocked] = useState(false);
  const manager = useFunctionOnce(createLockManager, setLocked);

  useLayoutEffect(manager.onMounted, emptyArray);

  return [isLocked, manager.acquire];
}

interface LockManager {
  acquire: () => Promise<() => void>;
  onMounted: EffectCallback;
}

function createLockManager(setLocked: (isLocked: boolean) => void): LockManager {
  let isMounted = false;

  const lock = new Lock();

  const acquire = (): Promise<() => void> => {
    if (!isMounted) {
      return new Promise(noop);
    }

    setLocked(true);

    return lock.acquire().then(resolve => () => {
      resolve();
      setLocked(lock.isLocked);
    });
  };

  const handleMounted: EffectCallback = () => {
    isMounted = true;

    return () => {
      isMounted = false;
    };
  };

  return {
    acquire,
    onMounted: handleMounted,
  };
}
