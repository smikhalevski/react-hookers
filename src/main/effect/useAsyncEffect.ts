import {DependencyList, EffectCallback, useEffect, useRef} from 'react';
import {AwaitableLike, isPromiseLike} from 'parallel-universe';
import {isFunction} from '../utils';

export type AsyncEffectCallback = (signal: AbortSignal) => AwaitableLike<(() => void) | void>;

export function useAsyncEffect(effect: AsyncEffectCallback, deps: DependencyList): void {
  const manager = useRef<ReturnType<typeof createAsyncEffectManager>>().current = createAsyncEffectManager(effect);

  manager.__callback = effect;

  useEffect(manager.__effect, deps);
}

export function createAsyncEffectManager(effect: AsyncEffectCallback) {

  let destructor: (() => void) | void;
  let abortController: AbortController | undefined;

  const setDestructor = (d: (() => void) | void) => {
    destructor = isFunction(d) ? d : undefined;
  };

  const cleanup = () => {
    destructor?.();
    destructor = undefined;
    abortController?.abort();
    abortController = undefined;
  };

  const __effect: EffectCallback = () => {
    abortController = new AbortController();

    const result = manager.__callback(abortController.signal);

    if (isPromiseLike(result)) {
      result.then(setDestructor);
    } else {
      setDestructor(result);
    }

    return cleanup;
  };

  const manager = {
    __callback: effect,
    __effect,
  };

  return manager;
}
