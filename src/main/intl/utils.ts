import { emptyObject } from '../utils/lang.js';

/**
 * Removes all diacritic marks from a string.
 *
 * @example
 * stripDiacritics('Olá, você aí');
 * // ⮕ 'Ola, voce ai'
 *
 * @param str The string to normalize.
 * @group Intl
 */
export function stripDiacritics(str: string): string {
  return str.normalize('NFKD').replace(/[\u0300-\u036F]/g, '');
}

/**
 * Returns an {@link Intl.Collator} instance cached for the given locale and options.
 *
 * @param locale The locale.
 * @param options Collator options.
 * @group Intl
 */
export function getCollator(locale: string, options?: Intl.CollatorOptions): Intl.Collator {
  return getCachedInstance(Intl.Collator, locale, options || emptyObject);
}

/**
 * Returns an {@link Intl.ListFormat} instance cached for the given locale and options.
 *
 * @param locale The locale.
 * @param options List format options.
 * @group Intl
 */
export function getListFormat(locale: string, options?: Intl.ListFormatOptions): Intl.ListFormat {
  return getCachedInstance(Intl.ListFormat, locale, options || emptyObject);
}

/**
 * Returns an {@link Intl.NumberFormat} instance cached for the given locale and options.
 *
 * @param locale The locale.
 * @param options Number format options.
 * @group Intl
 */
export function getNumberFormat(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  return getCachedInstance(Intl.NumberFormat, locale, options || emptyObject);
}

/**
 * Returns an {@link Intl.DateTimeFormat} instance cached for the given locale and options.
 *
 * @param locale The locale.
 * @param options Date/time format options.
 * @group Intl
 */
export function getDateTimeFormat(locale: string, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return getCachedInstance(Intl.DateTimeFormat, locale, options || emptyObject);
}

/**
 * Returns an {@link Intl.PluralRules} instance cached for the given locale and options.
 *
 * @param locale The locale.
 * @param options Plural rules options.
 * @group Intl
 */
export function getPluralRules(locale: string, options?: Intl.PluralRulesOptions): Intl.PluralRules {
  return getCachedInstance(Intl.PluralRules, locale, options || emptyObject);
}

/**
 * Returns an {@link Intl.DisplayNames} instance cached for the given locale and options.
 *
 * @param locale The locale.
 * @param options Display names options.
 * @group Intl
 */
export function getDisplayNames(locale: string, options: Intl.DisplayNamesOptions): Intl.DisplayNames {
  return getCachedInstance(Intl.DisplayNames, locale, options);
}

/**
 * Returns an {@link Intl.RelativeTimeFormat} instance cached for the given locale and options.
 *
 * @param locale The locale.
 * @param options Relative time format options.
 * @group Intl
 */
export function getRelativeTimeFormat(
  locale: string,
  options: Intl.RelativeTimeFormatOptions
): Intl.RelativeTimeFormat {
  return getCachedInstance(Intl.RelativeTimeFormat, locale, options);
}

const instanceCache = new Map<string, WeakMap<Function, WeakMap<object, object>>>();

function getCachedInstance<O, T>(constructor: new (locale: string, options: O) => T, locale: string, options: O): T {
  let value;

  value = instanceCache.get(locale) || (instanceCache.set(locale, (value = new WeakMap())), value);

  value = value.get(constructor) || (value.set(constructor, (value = new WeakMap())), value);

  value = value.get(options) || (value.set(options, (value = new constructor(locale, options))), value);

  return value;
}
