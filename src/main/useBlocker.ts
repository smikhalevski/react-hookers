import { Blocker } from 'parallel-universe';
import { EffectCallback, useEffect, useRef, useState } from 'react';
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

  useEffect(manager.effect, emptyDeps);

  return [isBlocked, manager.block, manager.unblock];
}

function createBlockerManager(setBlocked: (blocked: boolean) => void) {
  const blocker = new Blocker<any>();

  const block: Blocker<unknown>['block'] = () => {
    setBlocked(true);
    return blocker.block();
  };

  const unblock: Blocker<unknown>['unblock'] = value => {
    setBlocked(false);
    blocker.unblock(value);
  };

  let doBlock = block;
  let doUnblock = unblock;

  const effect: EffectCallback = () => {
    doBlock = block;
    doUnblock = unblock;

    return () => {
      doBlock = () => new Promise(noop);
      doUnblock = noop;
    };
  };

  return {
    effect,
    block() {
      return doBlock();
    },
    unblock(value: unknown) {
      doUnblock(value);
    },
  };
}
