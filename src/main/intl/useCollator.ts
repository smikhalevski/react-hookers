import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { createIntlCache } from './utils.js';

const getOrCreate = createIntlCache((locale, options) => new Intl.Collator(locale, options));

/**
 * Provides localized {@link Intl.Collator} for the current {@link useLocale locale}.
 *
 * @example
 * const collator = useCollator({ caseFirst: 'upper' });
 *
 * collator.compare('Hello', 'goodbye');
 * // ⮕ 1
 *
 * @param options Format options. Create options outside of rendering to enable format caching.
 * @group Intl
 */
export function useCollator(options: Intl.CollatorOptions = emptyObject): Intl.Collator {
  const { locale } = useLocale();

  return getOrCreate(locale, options);
}
