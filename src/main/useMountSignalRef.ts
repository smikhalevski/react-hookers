import { EffectCallback, useRef } from 'react';
import { useInsertionEffect } from './useInsertionEffect';
import { emptyDeps } from './utils';

/**
 * Returns an immutable ref that holds `AbortSignal` that is aborted when the component is unmounted.
 */
export function useMountSignalRef(): { readonly current: AbortSignal } {
  const manager = (useRef<ReturnType<typeof createMountSignalRefManager>>().current ||= createMountSignalRefManager());

  useInsertionEffect(manager.effect, emptyDeps);

  return manager.ref;
}

function createMountSignalRefManager() {
  const ref = { current: new AbortController().signal };

  const effect: EffectCallback = () => {
    const abortController = new AbortController();

    ref.current = abortController.signal;

    return () => {
      abortController.abort();
    };
  };

  return { effect, ref };
}
