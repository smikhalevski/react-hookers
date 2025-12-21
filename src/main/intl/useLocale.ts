import { createContext, useContext } from 'react';

const LocaleContext = createContext<Locale>({ locale: 'en-US', isRTL: false });

LocaleContext.displayName = 'LocaleContext';

/**
 * Provides the language tag and text direction.
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
   * The [BCP 47](https://www.ietf.org/rfc/bcp/bcp47.txt) language tag.
   */
  locale: string;

  /**
   * `true` if right-to-left text direction should be used.
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
