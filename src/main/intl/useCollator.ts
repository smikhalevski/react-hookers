import { useMemo } from 'react';
import { emptyObject } from '../utils/lang';
import { createCache } from './utils';
import { useLocale } from './useLocale';

const getOrCreate = createCache((locale, options) => new Intl.Collator(locale, options));

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

  return useMemo(() => getOrCreate(locale, options), [locale, options]);
}
