import { Blocker } from 'parallel-universe';
import { EffectCallback, useRef, useState } from 'react';
import { useInsertionEffect } from './useInsertionEffect';
import { emptyDeps, noop } from './utils';

/**
 * Blocks UI from an async context.
 *
 * @template T The type of value that can be passed to `unblock` to resolve the `Promise` returned by `block`.
 */
export function useBlocker<T = void>(): [blocked: boolean, block: () => Promise<T>, unblock: (result: T) => void] {
  const [blocked, setBlocked] = useState(false);
  const manager = (useRef<ReturnType<typeof createBlockerManager>>().current ||= createBlockerManager(setBlocked));

  useInsertionEffect(manager.effect, emptyDeps);

  return [blocked, manager.block, manager.unblock];
}

function createBlockerManager(setBlocked: (blocked: boolean) => void) {
  const blocker = new Blocker<any>();

  const block = blocker.block.bind(blocker);
  const unblock = blocker.unblock.bind(blocker);

  let _block = block;
  let _unblock = unblock;

  const effect: EffectCallback = () => {
    _block = block;
    _unblock = unblock;

    const unsubscribe = blocker.subscribe(() => {
      setBlocked(blocker.isBlocked);
    });

    return () => {
      const promise = new Promise(noop);

      _block = () => promise;
      _unblock = noop;

      unsubscribe();
    };
  };

  return {
    effect,
    block() {
      return _block();
    },
    unblock(result: unknown) {
      _unblock(result);
    },
  };
}
