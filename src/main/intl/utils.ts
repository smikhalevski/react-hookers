/**
 * Removes all diacritic characters from the string.
 *
 * @example
 * normalizeDiacritics('Olá, você aí');
 * // ⮕ 'Ola, voce ai'
 *
 * @param str A string to normalize.
 * @group Intl
 */
export function stripDiacritics(str: string): string {
  return str.normalize('NFKD').replace(/[\u0300-\u036F]/g, '');
}

/**
 * Caches factory values by locale and options.
 */
export function createIntlCache<O extends object, V>(
  factory: (locale: string, options: O) => V
): (locale: string, options: O) => V {
  const cache = new Map<string, WeakMap<O, V>>();

  return (locale, options) => {
    let group = cache.get(locale);

    if (group === undefined) {
      group = new WeakMap();
      cache.set(locale, group);
    }

    let value = group.get(options);

    if (value === undefined) {
      value = factory(locale, options);
      group.set(options, value);
    }

    return value;
  };
}
