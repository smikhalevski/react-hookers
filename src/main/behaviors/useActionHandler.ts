import { createContext, useContext } from 'react';

const ActionHandlerContext = createContext<((value: unknown) => void) | undefined>(undefined);

ActionHandlerContext.displayName = 'ActionHandlerContext';

/**
 * Provides a global action handler to a subtree.
 *
 * @see {@link useActionHandler}
 * @group Behaviors
 */
export const ActionHandlerProvider = ActionHandlerContext.Provider;

/**
 * A global action handler provided to a subtree.
 *
 * @see {@link ActionHandlerProvider}
 * @group Behaviors
 */
export function useActionHandler(): ((value: unknown) => void) | undefined {
  return useContext(ActionHandlerContext);
}
