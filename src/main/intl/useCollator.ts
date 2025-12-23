import { useMemoValue } from '../useMemoValue.js';
import { emptyObject } from '../utils/lang.js';
import { useLocale } from './useLocale.js';
import { getCollator } from './utils.js';

/**
 * Returns a localized {@link Intl.Collator} for the current {@link useLocale locale}.
 *
 * @example
 * const collator = useCollator({ caseFirst: 'upper' });
 *
 * collator.compare('Hello', 'goodbye');
 * // ⮕ 1
 *
 * @param options Collator options.
 * @group Intl
 */
export function useCollator(options: Intl.CollatorOptions = emptyObject): Intl.Collator {
  return getCollator(useLocale().locale, useMemoValue(options));
}
