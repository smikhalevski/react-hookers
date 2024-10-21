import { Blocker } from 'parallel-universe';
import { EffectCallback, useLayoutEffect, useState } from 'react';
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

  useLayoutEffect(manager.onMounted, emptyArray);

  return [isBlocked, manager.block, manager.unblock];
}

interface BlockerManager {
  block: () => Promise<unknown>;
  unblock: (result: unknown) => void;
  onMounted: EffectCallback;
}

function createBlockerManager(setBlocked: (blocked: boolean) => void): BlockerManager {
  let isMounted = false;

  const blocker = new Blocker<unknown>();

  const block = (): Promise<unknown> => {
    if (!isMounted) {
      return new Promise(noop);
    }

    setBlocked(true);
    return blocker.block();
  };

  const unblock = (value: unknown): void => {
    if (!isMounted) {
      return;
    }

    setBlocked(false);
    blocker.unblock(value);
  };

  const handleMounted: EffectCallback = () => {
    isMounted = true;

    return () => {
      isMounted = false;
    };
  };

  return {
    block,
    unblock,
    onMounted: handleMounted,
  };
}
