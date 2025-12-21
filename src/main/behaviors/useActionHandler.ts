import { createContext, useContext } from 'react';

const ActionHandlerContext = createContext<((value: any) => void) | undefined>(undefined);

ActionHandlerContext.displayName = 'ActionHandlerContext';

/**
 * Provides a global action handler to a subtree.
 *
 * @see {@link useActionHandler}
 * @group Behaviors
 */
export const ActionHandlerProvider = ActionHandlerContext.Provider;

/**
 * Returns the global action handler provided to the current subtree.
 *
 * @see {@link ActionHandlerProvider}
 * @group Behaviors
 */
export function useActionHandler(): ((value: any) => void) | undefined {
  return useContext(ActionHandlerContext);
}
