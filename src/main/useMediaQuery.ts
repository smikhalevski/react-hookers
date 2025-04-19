import { EffectCallback, useEffect, useState } from 'react';
import { useFunctionOnce } from './useFunctionOnce';

/**
 * Returns `true` if the window
 * [matches the media query](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia), or `false` otherwise.
 *
 * @example
 * const isMatched = useMediaQuery('(min-width: 600px)');
 *
 * @param query The media query to match.
 * @param initialValue A value returned during the initial render.
 * @group Other
 */
export function useMediaQuery(query: string, initialValue?: boolean): boolean {
  const [isMatched, setMatched] = useState(() =>
    initialValue !== undefined ? initialValue : typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  const manager = useFunctionOnce(createMediaQueryManager, setMatched);

  manager.query = query;

  useEffect(manager.onQueryUpdated, [query]);

  return isMatched;
}

interface MediaQueryManager {
  query: string;
  onQueryUpdated: EffectCallback;
}

function createMediaQueryManager(setMatched: (isMatched: boolean) => void): MediaQueryManager {
  const handleQueryUpdated: EffectCallback = () => {
    const mediaQueryList = window.matchMedia(manager.query);

    mediaQueryList.addEventListener('change', handleQueryUpdated);

    setMatched(mediaQueryList.matches);

    return () => mediaQueryList.removeEventListener('change', handleMediaQueryChange);
  };

  const handleMediaQueryChange = (event: MediaQueryListEvent) => setMatched(event.matches);

  const manager: MediaQueryManager = {
    query: undefined!,
    onQueryUpdated: handleQueryUpdated,
  };

  return manager;
}
