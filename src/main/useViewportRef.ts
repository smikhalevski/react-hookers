import { createContext, RefObject, useContext } from 'react';

const ViewportRefContext = createContext<RefObject<Element> | undefined>(undefined);

ViewportRefContext.displayName = 'ViewportRefContext';

/**
 * Provides a ref to a viewport element to children.
 *
 * @group Other
 */
export const ViewportRefProvider = ViewportRefContext.Provider;

/**
 * Returns a ref of an element that is a current viewport, or `undefined` if viewport element is unspecified.
 *
 * @group Other
 */
export function useViewportRef(): RefObject<Element> | undefined {
  return useContext(ViewportRefContext);
}
