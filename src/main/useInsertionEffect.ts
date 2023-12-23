import { DependencyList, EffectCallback, useInsertionEffect as useInsertionEffect_, useLayoutEffect } from 'react';
import { noop } from './utils';

/**
 * Drop-in replacement for `React.useInsertionEffect` that works in older React versions and doesn't emit warnings
 * during SSR.
 *
 * @param effect Imperative function that can return a cleanup function
 * @param deps If present, effect will only activate if the values in the list change.
 */
export const useInsertionEffect: (effect: EffectCallback, deps?: DependencyList) => void =
  typeof window === 'undefined' ? noop : useInsertionEffect_ === undefined ? useLayoutEffect : useInsertionEffect_;
