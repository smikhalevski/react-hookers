import {useRef} from 'react';
import {useRerender} from '../rerender';
import {Blocker} from 'parallel-universe';
import {useEffectOnce} from '../effect';

/**
 * Blocks UI from the async context.
 *
 * @template T The type of value that can be passed to `unblock` to resolve the `Promise` returned by `block`.
 *
 * @see {@link Lock}
 */
export function useBlocker<T = void>(): Blocker<T> {
  const rerender = useRerender();
  const blocker = useRef<Blocker<T>>().current ||= new Blocker<T>();

  useEffectOnce(() => blocker.subscribe(rerender));

  return blocker;
}
