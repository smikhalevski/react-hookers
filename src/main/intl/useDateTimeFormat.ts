import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { getDateTimeFormat } from './utils.js';

/**
 * Returns a localized {@link Intl.DateTimeFormat} for the current {@link useLocale locale}.
 *
 * @example
 * const format = useDateTimeFormat({ dateStyle: 'full' });
 *
 * format.format(100);
 * // ⮕ 'Monday, April 21, 2025'
 *
 * @param options Format options. Create the options object outside of render to enable formatter caching.
 * @group Intl
 */
export function useDateTimeFormat(options: Intl.DateTimeFormatOptions = emptyObject): Intl.DateTimeFormat {
  return getDateTimeFormat(useLocale().locale, options);
}
