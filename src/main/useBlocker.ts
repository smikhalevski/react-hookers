import {useRef} from 'react';
import {useRerender} from './useRerender';
import {createBlocker, IBlocker} from './createBlocker';

/**
 * Blocks UI from the async context. For example, open a popup from async context by locking and close it by unlocking.
 *
 * ```ts
 * const blocker = useBlocker<boolean>();
 *
 * const handleDelete = async () => {
 *   if (await blocker.block()) {
 *     // Proceed with deletion
 *   }
 * };
 *
 * <Popup opened={blocker.blocked}>
 *   {'Are you sure?'}
 *
 *   <button onClick={() => blocker.unblock(false)}>
 *     {'No, don\'t delete'}
 *   </button>
 *
 *   <button onClick={() => blocker.unblock(true)}>
 *     {'Yes, delete'}
 *   </button>
 * </Popup>
 *
 * <button
 *   disabled={blocker.blocked}
 *   onClick={handleDelete}
 * >
 *   {'Delete'}
 * </button>
 * ```
 */
export function useBlocker<T = void>(): IBlocker<T> {
  const rerender = useRerender();
  return useRef<IBlocker<T>>().current ||= createBlocker<T>(rerender);
}
