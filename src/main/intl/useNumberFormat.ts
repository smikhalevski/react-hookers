import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { getNumberFormat } from './utils.js';

/**
 * Returns a localized {@link Intl.NumberFormat} for the current {@link useLocale locale}.
 *
 * @example
 * const format = useNumberFormat({ style: 'currency', currency: 'USD' });
 *
 * format.format(100);
 * // ⮕ '$100.00'
 *
 * @param options Format options. Create the options object outside of render to enable formatter caching.
 * @group Intl
 */
export function useNumberFormat(options: Intl.NumberFormatOptions = emptyObject): Intl.NumberFormat {
  return getNumberFormat(useLocale().locale, options);
}
