import {EffectCallback} from 'react';
import {noop} from '../utils';

export function useMediaQuery(query: string): boolean {

}

function createMediaQueryManager() {

  let query: string;
  let nextQuery: string;
  let mediaQuery: MediaQueryList;

  const listener = () => {
    manager.__matched = mediaQuery.matches;
  };

  const __setQuery = (query: string) => {
    nextQuery = query
    if (query === nextQuery) {
      return;
    }
    mediaQuery?.removeEventListener('change', listener);

    mediaQuery = window.matchMedia(query);

    mediaQuery.addEventListener('change', listener);
  };

  const __effect: EffectCallback = () => () => {
    mediaQuery?.removeEventListener('change', listener);
  };

  const manager = {
    __matched: false,
  };

  return manager;
}
