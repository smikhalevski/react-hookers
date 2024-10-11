import { EffectCallback, useEffect, useReducer } from 'react';
import { useFunction } from './useFunction';
import { emptyArray } from './utils';

/**
 * Returns `true` if the window
 * [matches the media query](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia), or `false` otherwise.
 *
 * @param query The media query to match.
 * @param initialValue If non-`undefined` then returned during SSR and the initial client render.
 */
export function useMediaQuery(query: string, initialValue?: boolean): boolean {
  const [, dispatch] = useReducer(reduceCount, 0);

  const manager = useFunction(createMediaQueryManager, dispatch, initialValue);

  manager.setQuery(query);

  useEffect(manager.effect, emptyArray);

  return manager.checkMatches();
}

function reduceCount(count: number) {
  return count + 1;
}

function createMediaQueryManager(dispatch: () => void, initialValue: boolean | undefined) {
  let prevQuery: string;
  let mediaQueryList: MediaQueryList | undefined;

  const setQuery = (query: string) => {
    if (prevQuery === query || typeof window === 'undefined') {
      return;
    }

    prevQuery = query;

    mediaQueryList?.removeEventListener('change', dispatch);

    mediaQueryList = window.matchMedia(query);

    mediaQueryList.addEventListener('change', dispatch);
  };

  const effect: EffectCallback = () => {
    initialValue = undefined;

    return () => {
      mediaQueryList?.removeEventListener('change', dispatch);
    };
  };

  return {
    effect,
    setQuery,
    checkMatches(): boolean {
      return initialValue !== undefined ? initialValue : mediaQueryList !== undefined && mediaQueryList.matches;
    },
  };
}
