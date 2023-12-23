import { Blocker } from 'parallel-universe';
import { EffectCallback, useRef, useState } from 'react';
import { useInsertionEffect } from './useInsertionEffect';
import { emptyDeps, noop } from './utils';

/**
 * Block an async flow and unblock it from an external context.
 */
export function useBlocker(): [isBlocked: boolean, block: () => Promise<void>, unblock: () => void];

/**
 * Block an async flow and unblock it from an external context.
 *
 * @template T The type of value that can be passed to `unblock` to resolve the `Promise` returned by `block`.
 */
export function useBlocker<T>(): [isBlocked: boolean, block: () => Promise<T>, unblock: (result: T) => void];

export function useBlocker() {
  const [isBlocked, setBlocked] = useState(false);
  const manager = (useRef<ReturnType<typeof createBlockerManager>>().current ||= createBlockerManager(setBlocked));

  useInsertionEffect(manager.effect, emptyDeps);

  return [isBlocked, manager.block, manager.unblock];
}

function createBlockerManager(setBlocked: (blocked: boolean) => void) {
  const blocker = new Blocker<any>();

  const block = blocker.block.bind(blocker);
  const unblock = blocker.unblock.bind(blocker);

  let doBlock = block;
  let doUnblock = unblock;

  const effect: EffectCallback = () => {
    doBlock = block;
    doUnblock = unblock;

    const unsubscribe = blocker.subscribe(() => {
      setBlocked(blocker.isBlocked);
    });

    return () => {
      doBlock = () => new Promise(noop);
      doUnblock = noop;

      unsubscribe();
    };
  };

  return {
    effect,
    block() {
      return doBlock();
    },
    unblock(result: unknown) {
      doUnblock(result);
    },
  };
}
