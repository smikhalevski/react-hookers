import { useMemo } from 'react';
import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { createCache } from './utils.js';

const getOrCreate = createCache((locale, options) => new Intl.RelativeTimeFormat(locale, options));

/**
 * Provides localized {@link Intl.RelativeTimeFormat} for the current {@link useLocale locale}.
 *
 * @param options Format options. Create options outside of rendering to enable format caching.
 * @group Intl
 */
export function useRelativeTimeFormat(options: Intl.RelativeTimeFormatOptions = emptyObject): Intl.RelativeTimeFormat {
  const { locale } = useLocale();

  return useMemo(() => getOrCreate(locale, options), [locale, options]);
}
