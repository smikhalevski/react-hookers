import {useRef} from 'react';
import {Lock} from './Lock';

/**
 * Creates a new {@link Lock}.
 *
 * Lock can be used for ordering asynchronous events.
 *
 * For example, you may have multiple popups that are opened independently and you want them to be opened one after
 * another.
 *
 * ```ts
 * const lock = useLock();
 *
 * const handleOpenPopup = async () => {
 *   const release = await lock.acquire();
 *
 *   // Open popup here then invoke release() when popup is closed.
 * }
 * ```
 *
 * Multiple parties may call `lock.acquire()`, but they would receive a release callback only after the previous party
 * released the lock.
 *
 * @see {@link https://en.wikipedia.org/wiki/Lock_(computer_science) Lock (computer science)}
 * @see {@link Lock}
 * @see {@link useBlocker}
 */
export function useLock(): Lock {
  return useRef<Lock>().current ||= new Lock();
}
