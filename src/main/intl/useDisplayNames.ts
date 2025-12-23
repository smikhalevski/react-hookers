import { useMemoValue } from '../useMemoValue.js';
import { useLocale } from './useLocale.js';
import { getDisplayNames } from './utils.js';

/**
 * Returns localized {@link Intl.DisplayNames} for the current {@link useLocale locale}.
 *
 * @param options Display names options.
 * @group Intl
 */
export function useDisplayNames(options: Intl.DisplayNamesOptions): Intl.DisplayNames {
  return getDisplayNames(useLocale().locale, useMemoValue(options));
}
