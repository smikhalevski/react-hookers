import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { createIntlCache } from './utils.js';

const getOrCreate = createIntlCache((locale, options) => new Intl.RelativeTimeFormat(locale, options));

/**
 * Provides localized {@link Intl.RelativeTimeFormat} for the current {@link useLocale locale}.
 *
 * @param options Format options. Create options outside of rendering to enable format caching.
 * @group Intl
 */
export function useRelativeTimeFormat(options: Intl.RelativeTimeFormatOptions = emptyObject): Intl.RelativeTimeFormat {
  const { locale } = useLocale();

  return getOrCreate(locale, options);
}
