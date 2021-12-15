import {useRef} from 'react';
import {useRerender} from '../rerender';
import {Blocker} from './Blocker';

/**
 * Blocks UI from the async context. For example, open a popup from async context by locking and close it by unlocking.
 *
 * ```tsx
 * const DeleteButton: FC = () => {
 *
 *   const blocker = useBlocker<boolean>();
 *
 *   const handleDelete = async () => {
 *     if (await blocker.block()) {
 *       // Proceed with deletion
 *     }
 *   };
 *
 *   return (
 *       <>
 *         <Popup opened={blocker.blocked}>
 *           {'Are you sure?'}
 *
 *           <button onClick={() => blocker.unblock(false)}>
 *             {'No, don\'t delete'}
 *           </button>
 *
 *           <button onClick={() => blocker.unblock(true)}>
 *             {'Yes, delete'}
 *           </button>
 *         </Popup>
 *
 *         <button
 *             disabled={blocker.blocked}
 *             onClick={handleDelete}
 *         >
 *           {'Delete'}
 *         </button>
 *       </>
 *   );
 * };
 * ```
 *
 * @template T The type of value that can be passed to {@link Blocker.unblock} to resolve the `Promise` returned by
 *     {@link Blocker.block}.
 *
 * @see {@link Blocker}
 * @see {@link Lock}
 * @see {@link useLock}
 */
export function useBlocker<T = void>(): Blocker<T> {
  const rerender = useRerender();
  return useRef<Blocker<T>>().current ||= new Blocker<T>(rerender);
}
