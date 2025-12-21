import { createContext, useContext } from 'react';

const CloseHandlerContext = createContext<(() => void) | undefined>(undefined);

CloseHandlerContext.displayName = 'CloseHandlerContext';

/**
 * Provides a global close handler to a subtree.
 *
 * Descendant components can retrieve this handler via {@link useCloseHandler} and invoke it to request closing of
 * the enclosing context (for example, dismissing a modal, popup, or rendered container).
 *
 * @see {@link useCloseHandler}
 * @group Behaviors
 */
export const CloseHandlerProvider = CloseHandlerContext.Provider;

/**
 * Returns a global close handler provided to the nearest enclosing {@link CloseHandlerProvider},
 * or `undefined` if none is present.
 *
 * @see {@link CloseHandlerProvider}
 * @group Behaviors
 */
export function useCloseHandler(): (() => void) | undefined {
  return useContext(CloseHandlerContext);
}
