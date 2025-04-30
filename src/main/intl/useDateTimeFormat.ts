import { useMemo } from 'react';
import { emptyObject } from '../utils/lang';
import { createCache } from './utils';
import { useLocale } from './useLocale';

const getOrCreate = createCache((locale, options) => new Intl.DateTimeFormat(locale, options));

/**
 * Provides localized {@link Intl.DateTimeFormat} for the current {@link useLocale locale}.
 *
 * @example
 * const format = useDateTimeFormat({ dateStyle: 'full' });
 *
 * format.format(100);
 * // ⮕ 'Monday, April 21, 2025'
 *
 * @param options Format options. Create options outside of rendering to enable format caching.
 * @group Intl
 */
export function useDateTimeFormat(options: Intl.DateTimeFormatOptions = emptyObject): Intl.DateTimeFormat {
  const { locale } = useLocale();

  return useMemo(() => getOrCreate(locale, options), [locale, options]);
}
