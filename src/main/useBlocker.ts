import { Blocker } from 'parallel-universe';
import { EffectCallback, useEffect, useState } from 'react';
import { useFunction } from './useFunction';
import { emptyArray, noop } from './utils';

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
  const manager = useFunction(createBlockerManager, setBlocked);

  useEffect(manager.onComponentMounted, emptyArray);

  return [isBlocked, manager.block, manager.unblock];
}

interface BlockerManager {
  block: () => Promise<unknown>;
  unblock: (result: unknown) => void;
  onComponentMounted: EffectCallback;
}

function createBlockerManager(setBlocked: (blocked: boolean) => void): BlockerManager {
  const blocker = new Blocker<unknown>();

  let isMounted = false;

  const block = () => {
    if (!isMounted) {
      return new Promise(noop);
    }

    setBlocked(true);
    return blocker.block();
  };

  const unblock = (value: unknown) => {
    if (!isMounted) {
      return;
    }

    setBlocked(false);
    blocker.unblock(value);
  };

  const handleComponentMounted: EffectCallback = () => {
    isMounted = true;

    return () => {
      isMounted = false;
    };
  };

  return {
    block,
    unblock,
    onComponentMounted: handleComponentMounted,
  };
}
