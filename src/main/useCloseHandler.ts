import { createContext, useContext } from 'react';

const CloseHandlerContext = createContext<(() => void) | undefined>(undefined);

CloseHandlerContext.displayName = 'CloseHandlerContext';

/**
 * Provides a global close handler to a subtree.
 */
export const CloseHandlerProvider = CloseHandlerContext.Provider;

/**
 * A global close handler provided to a subtree.
 */
export function useCloseHandler(): (() => void) | undefined {
  return useContext(CloseHandlerContext);
}
