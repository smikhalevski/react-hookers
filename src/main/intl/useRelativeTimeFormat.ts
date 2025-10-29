import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { getRelativeTimeFormat } from './utils.js';

/**
 * Provides localized {@link Intl.RelativeTimeFormat} for the current {@link useLocale locale}.
 *
 * @param options Format options. Create options outside of rendering to enable format caching.
 * @group Intl
 */
export function useRelativeTimeFormat(options: Intl.RelativeTimeFormatOptions = emptyObject): Intl.RelativeTimeFormat {
  return getRelativeTimeFormat(useLocale().locale, options);
}
