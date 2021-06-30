import React from 'react';
import {useRerender} from './useRerender';

export interface IBlocker<T> {

  /**
   * Returns `true` if this blocker is blocked.
   */
  readonly blocked: boolean;

  /**
   * Returns promise that is resolved with the result passed to `unblock`. If blocker is already blocked then the same
   * promise is returned.
   */
  block(): Promise<T>;

  /**
   * Resolves the promise returned from `block`. If the blocker isn't blocked then no-op.
   */
  unblock(result: T): void;
}

/**
 * Separates blocking/unblocking concerns.
 */
export function useBlocker<T = void>(): IBlocker<T> {
  const rerender = useRerender();
  return React.useRef<IBlocker<T>>().current ||= createBlocker<T>(rerender);
}

function createBlocker<T>(rerender: () => void): IBlocker<T> {

  let promise: Promise<T> | undefined;
  let resolve: (result: T) => void;

  return {

    get 'blocked'() {
      return promise != null;
    },

    'block'() {
      if (!promise) {
        promise = new Promise((nextResolve) => resolve = nextResolve);
        rerender();
      }
      return promise;
    },

    'unblock'(result) {
      if (promise) {
        resolve(result);
        promise = undefined;
        rerender();
      }
    },
  };
}
