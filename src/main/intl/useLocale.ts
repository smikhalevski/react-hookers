import { createContext, useContext } from 'react';

const LocaleContext = createContext<Locale>({ locale: 'en-US', isRTL: false });

LocaleContext.displayName = 'LocaleContext';

/**
 * Providers the language tag and text direction.
 *
 * @group Intl
 */
export const LocaleProvider = LocaleContext.Provider;

/**
 * The language tag and text direction.
 *
 * @group Intl
 */
export interface Locale {
  /**
   * The [BCP47](https://www.ietf.org/rfc/bcp/bcp47.txt) locale.
   */
  locale: string;

  /**
   * `true` if right-to-left text direction must be used.
   */
  isRTL: boolean;
}

/**
 * Returns the current language tag and text direction.
 *
 * @group Intl
 */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}
