import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { getRelativeTimeFormat } from './utils.js';

/**
 * Returns a localized {@link Intl.RelativeTimeFormat} for the current {@link useLocale locale}.
 *
 * @param options Format options. Create the options object outside of render
 * to enable formatter caching.
 * @group Intl
 */
export function useRelativeTimeFormat(options: Intl.RelativeTimeFormatOptions = emptyObject): Intl.RelativeTimeFormat {
  return getRelativeTimeFormat(useLocale().locale, options);
}
