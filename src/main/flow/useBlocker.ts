import { Blocker } from 'parallel-universe';
import { EffectCallback, useRef, useState } from 'react';
import { useEffectOnce } from '../effect';

/**
 * Blocks UI from the async context.
 *
 * @template T The type of value that can be passed to `unblock` to resolve the `Promise` returned by `block`.
 */
export function useBlocker<T = void>(): [blocked: boolean, block: () => Promise<T>, unblock: (result: T) => void] {
  const [blocked, setBlocked] = useState(false);
  const manager = (useRef<ReturnType<typeof createBlockerManager>>().current ||= createBlockerManager(setBlocked));

  useEffectOnce(manager.__effect);

  return [blocked, manager.__block, manager.__unblock];
}

function createBlockerManager(setBlocked: (blocked: boolean) => void) {
  const blocker = new Blocker<any>();

  const __effect: EffectCallback = () =>
    blocker.subscribe(() => {
      setBlocked(blocker.blocked);
    });

  return {
    __effect,
    __block: blocker.block.bind(blocker),
    __unblock: blocker.unblock.bind(blocker),
  };
}
