/**
 * Removes all diacritic characters from the {@link str string}.
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
export function createCache<Options extends object, Value>(
  factory: (locale: string, options: Options) => Value
): (locale: string, options: Options) => Value {
  const cache = new Map<string, WeakMap<Options, Value>>();

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
