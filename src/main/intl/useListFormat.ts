import { useMemoValue } from '../useMemoValue.js';
import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { getListFormat } from './utils.js';

/**
 * Returns a localized {@link Intl.ListFormat} for the current {@link useLocale locale}.
 *
 * @param options Format options.
 * @group Intl
 */
export function useListFormat(options: Intl.ListFormatOptions = emptyObject): Intl.ListFormat {
  return getListFormat(useLocale().locale, useMemoValue(options));
}
