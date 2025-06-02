import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { createIntlCache } from './utils.js';

const getOrCreate = createIntlCache((locale, options) => new Intl.NumberFormat(locale, options));

/**
 * Provides localized {@link Intl.NumberFormat} for the current {@link useLocale locale}.
 *
 * @example
 * const format = useNumberFormat({ style: 'currency', currency: 'USD' });
 *
 * format.format(100);
 * // ⮕ '$100.00'
 *
 * @param options Format options. Create options outside of rendering to enable format caching.
 * @group Intl
 */
export function useNumberFormat(options: Intl.NumberFormatOptions = emptyObject): Intl.NumberFormat {
  const { locale } = useLocale();

  return getOrCreate(locale, options);
}
