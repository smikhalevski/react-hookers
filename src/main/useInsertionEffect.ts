import { useInsertionEffect as useInsertionEffect_, useLayoutEffect } from 'react';
import { noop } from './utils';

/**
 * Same as `React.useLayoutEffect` but calls effect only once after the component is mounted.
 *
 * The optional cleanup callback is called when the component is unmounted.
 *
 * @see https://reactjs.org/docs/hooks-reference.html#useeffect React.useEffect
 */
export const useInsertionEffect =
  typeof window === 'undefined' ? noop : useInsertionEffect_ === undefined ? useLayoutEffect : useInsertionEffect_;
