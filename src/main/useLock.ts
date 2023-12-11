import { Lock } from 'parallel-universe';
import { EffectCallback, useRef, useState } from 'react';
import { useInsertionEffect } from './useInsertionEffect';
import { emptyDeps, noop } from './utils';

/**
 * Promise-based [lock implementation](https://github.com/smikhalevski/parallel-universe#lock).
 */
export function useLock(): [locked: boolean, acquire: () => Promise<() => void>] {
  const [locked, setLocked] = useState(false);
  const manager = (useRef<ReturnType<typeof createLockManager>>().current ||= createLockManager(setLocked));

  useInsertionEffect(manager.effect, emptyDeps);

  return [locked, manager.acquire];
}

function createLockManager(setLocked: (locked: boolean) => void) {
  const lock = new Lock();

  const acquire = lock.acquire.bind(lock);

  let _acquire = acquire;

  const effect: EffectCallback = () => {
    _acquire = acquire;

    const unsubscribe = lock.subscribe(() => {
      setLocked(lock.isLocked);
    });

    return () => {
      _acquire = () => new Promise(noop);
      unsubscribe();
    };
  };

  return {
    effect,
    acquire: () => _acquire(),
  };
}
