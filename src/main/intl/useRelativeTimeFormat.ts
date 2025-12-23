import { useMemoValue } from '../useMemoValue.js';
import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { getRelativeTimeFormat } from './utils.js';

/**
 * Returns a localized {@link Intl.RelativeTimeFormat} for the current {@link useLocale locale}.
 *
 * @param options Format options.
 * @group Intl
 */
export function useRelativeTimeFormat(options: Intl.RelativeTimeFormatOptions = emptyObject): Intl.RelativeTimeFormat {
  return getRelativeTimeFormat(useLocale().locale, useMemoValue(options));
}
