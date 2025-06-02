import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { createIntlCache } from './utils.js';

const getOrCreate = createIntlCache((locale, options) => new Intl.DateTimeFormat(locale, options));

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

  return getOrCreate(locale, options);
}
