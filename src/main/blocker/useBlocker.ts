import {useRef} from 'react';
import {useRerender} from '../rerender';
import {Blocker} from './Blocker';

/**
 * Blocks UI from the async context.
 *
 * @template T The type of value that can be passed to {@link Blocker.unblock} to resolve the `Promise` returned by
 *     {@link Blocker.block}.
 *
 * @see {@link Blocker}
 * @see {@link Lock}
 */
export function useBlocker<T = void>(): Blocker<T> {
  const rerender = useRerender();
  return useRef<Blocker<T>>().current ||= new Blocker<T>(rerender);
}
