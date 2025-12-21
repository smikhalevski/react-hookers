import { useLocale } from './useLocale.js';
import { getDisplayNames } from './utils.js';

/**
 * Returns localized {@link Intl.DisplayNames} for the current {@link useLocale locale}.
 *
 * @param options Display names options. Create the options object outside of render to enable formatter caching.
 * @group Intl
 */
export function useDisplayNames(options: Intl.DisplayNamesOptions): Intl.DisplayNames {
  return getDisplayNames(useLocale().locale, options);
}
