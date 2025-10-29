import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { getListFormat } from './utils.js';

/**
 * Provides localized {@link Intl.ListFormat} for the current {@link useLocale locale}.
 *
 * @param options Format options. Create options outside of rendering to enable format caching.
 * @group Intl
 */
export function useListFormat(options: Intl.ListFormatOptions = emptyObject): Intl.ListFormat {
  const { locale } = useLocale();

  return getListFormat(locale, options);
}
