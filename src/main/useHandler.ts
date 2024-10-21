import { type EffectCallback, useLayoutEffect } from 'react';
import { useFunction } from './useFunction';
import { emptyArray } from './utils';

/**
 * Returns a stable function identity that is no-op during initial render and after unmount.
 *
 * @param fn A callback that is called by the returned handler.
 * @returns A stable function identity.
 * @template A Arguments of a handler.
 * @template R A return value of a handler.
 */
export function useHandler<A extends any[], R>(
  fn: ((...args: A) => R) | null | undefined
): (...args: A) => R | undefined {
  const manager = useFunction(createHandlerManager<A, R>);

  manager.fn = fn;

  useLayoutEffect(manager.onMounted, emptyArray);

  return manager.handler;
}

interface HandlerManager<A extends any[], R> {
  fn: Function | null | undefined;
  handler: (...args: A) => R | undefined;
  onMounted: EffectCallback;
}

function createHandlerManager<A extends any[], R>(): HandlerManager<A, R> {
  let isMounted = false;

  const handleMounted: EffectCallback = () => {
    isMounted = true;

    return () => {
      isMounted = false;
    };
  };

  const handler = function () {
    const { fn } = manager;

    if (!isMounted || typeof fn !== 'function') {
      return;
    }

    if (arguments.length === 0) {
      return fn();
    }
    if (arguments.length === 1) {
      return fn(arguments[1]);
    }

    const args = [];

    for (let i = 0; i < arguments.length; ++i) {
      args.push(arguments[i]);
    }

    return fn(...args);
  };

  const manager: HandlerManager<A, R> = {
    fn: undefined!,
    handler,
    onMounted: handleMounted,
  };

  return manager;
}
