import { Lock } from 'parallel-universe';
import { EffectCallback, useRef, useState } from 'react';
import { useEffectOnce } from '../effect';

/**
 * Promise-based [lock implementation](https://github.com/smikhalevski/parallel-universe#lock).
 */
export function useLock(): [locked: boolean, acquire: () => Promise<() => void>] {
  const [locked, setLocked] = useState(false);
  const manager = (useRef<ReturnType<typeof createLockManager>>().current ||= createLockManager(setLocked));

  useEffectOnce(manager.__effect);

  return [locked, manager.__acquire];
}

function createLockManager(setLocked: (locked: boolean) => void) {
  const lock = new Lock();

  const __effect: EffectCallback = () =>
    lock.subscribe(() => {
      setLocked(lock.locked);
    });

  return {
    __effect,
    __acquire: lock.acquire.bind(lock),
  };
}
