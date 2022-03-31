import {Blocker} from 'parallel-universe';
import {EffectCallback, useRef} from 'react';
import {useEffectOnce} from '../effect';
import {useRerender} from '../render';

export type BlockerProtocol<T> = [blocked: boolean, block: () => Promise<T>, unblock: (result: T) => void];

/**
 * Blocks UI from the async context.
 *
 * @template T The type of value that can be passed to `unblock` to resolve the `Promise` returned by `block`.
 */
export function useBlocker<T = void>(): Readonly<BlockerProtocol<T>> {
  const rerender = useRerender();
  const manager = useRef<ReturnType<typeof createBlockerManager>>().current ||= createBlockerManager(rerender);

  useEffectOnce(manager.__effect);

  return manager.__protocol;
}

export function createBlockerManager(rerender: () => void) {

  const blocker = new Blocker();

  const __effect: EffectCallback = () => blocker.subscribe(() => {
    __protocol[0] = blocker.blocked;
    rerender();
  });

  const __protocol: BlockerProtocol<any> = [false, blocker.block.bind(blocker), blocker.unblock.bind(blocker)];

  return {
    __effect,
    __protocol,
  };
}
