import { useLocale } from './useLocale.js';
import { getDisplayNames } from './utils.js';

/**
 * Provides localized {@link Intl.DisplayNames} for the current {@link useLocale locale}.
 *
 * @param options Display names options. Create options outside of rendering to enable format caching.
 * @group Intl
 */
export function useDisplayNames(options: Intl.DisplayNamesOptions): Intl.DisplayNames {
  return getDisplayNames(useLocale().locale, options);
}
