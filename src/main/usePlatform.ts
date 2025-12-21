import { createContext, useContext } from 'react';

/**
 * @group Other
 */
export interface Platform {
  browser: BrowserType | null;
  os: OSType | null;
  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  isIOS: boolean;
  isMac: boolean;
  isApple: boolean;
  isWindows: boolean;
  isAndroid: boolean;
}

/**
 * @group Other
 */
export type BrowserType = 'chrome' | 'firefox' | 'safari';

/**
 * @group Other
 */
export type OSType = 'ios' | 'mac' | 'windows' | 'android';

/**
 * Returns the detected platform information from context.
 *
 * @group Other
 */
export function usePlatform(): Platform {
  return useContext(PlatformContext);
}

const BROWSER_CHROME = 'chrome';
const BROWSER_FIREFOX = 'firefox';
const BROWSER_SAFARI = 'safari';

const OS_IOS = 'ios';
const OS_MAC = 'mac';
const OS_WINDOWS = 'windows';
const OS_ANDROID = 'android';

const PlatformContext = createContext<Platform>(detectPlatform());

PlatformContext.displayName = 'PlatformContext';

/**
 * Provides platform information to the component tree.
 *
 * @group Other
 */
export const PlatformProvider = PlatformContext.Provider;

function getNavigatorUserAgent(): string {
  return typeof navigator !== 'undefined' ? navigator.userAgent : '';
}

/**
 * Infers the platform from the user agent string.
 *
 * @param userAgent A user agent string.
 * @group Other
 */
export function detectPlatform(userAgent = getNavigatorUserAgent()): Platform {
  const browser = detectBrowser(userAgent);
  const os = detectOS(userAgent);

  return {
    browser,
    os,
    isChrome: browser === BROWSER_CHROME,
    isSafari: browser === BROWSER_SAFARI,
    isFirefox: browser === BROWSER_FIREFOX,
    isIOS: os === OS_IOS,
    isMac: os === OS_MAC,
    isApple: os === OS_IOS || os === OS_MAC,
    isWindows: os === OS_WINDOWS,
    isAndroid: os === OS_ANDROID,
  };
}

/**
 * Infers the browser type from the user agent string.
 *
 * @param userAgent A user agent string.
 * @group Other
 */
export function detectBrowser(userAgent = getNavigatorUserAgent()): BrowserType | null {
  userAgent = userAgent.toLowerCase();

  if (userAgent.includes('chrome')) {
    return BROWSER_CHROME;
  }
  if (userAgent.includes('firefox')) {
    return BROWSER_FIREFOX;
  }
  if (userAgent.includes('webkit')) {
    return BROWSER_SAFARI;
  }
  return null;
}

/**
 * Infers the OS type from the user agent string.
 *
 * @param userAgent A user agent string.
 * @group Other
 */
export function detectOS(userAgent = getNavigatorUserAgent()): OSType | null {
  userAgent = userAgent.toLowerCase();

  if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
    return OS_IOS;
  }
  if (userAgent.includes('macintosh') || userAgent.includes('mac_powerpc')) {
    return OS_MAC;
  }
  if (userAgent.includes('windows')) {
    return OS_WINDOWS;
  }
  if (userAgent.includes('android')) {
    return OS_ANDROID;
  }
  return null;
}
