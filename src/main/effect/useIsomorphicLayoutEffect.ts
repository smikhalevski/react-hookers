import { useEffect, useLayoutEffect } from 'react';

/**
 * Drop-in replacement for `React.useLayoutEffect` that doesn't produce warnings during SSR.
 */
export const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
