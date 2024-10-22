import { createContext, useContext } from 'react';

export interface Platform {
  browser: string | undefined;
  os: string | undefined;

  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  isIOS: boolean;
  isMac: boolean;
  isApple: boolean;
  isWindows: boolean;
  isAndroid: boolean;
}

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

const PlatformContext = createContext<Platform>(
  detectPlatform(typeof navigator !== 'undefined' ? navigator.userAgent : '')
);

PlatformContext.displayName = 'PlatformContext';

export const PlatformProvider = PlatformContext.Provider;

/**
 * Infers the platform from the user agent string.
 *
 * @param userAgent A user agent string.
 */
export function detectPlatform(userAgent: string): Platform {
  userAgent = userAgent.toLowerCase();

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

function detectBrowser(userAgent: string): string | undefined {
  if (userAgent.includes('chrome')) {
    return BROWSER_CHROME;
  }
  if (userAgent.includes('firefox')) {
    return BROWSER_FIREFOX;
  }
  if (userAgent.includes('applewebkit')) {
    return BROWSER_SAFARI;
  }
}

function detectOS(userAgent: string): string | undefined {
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
}
