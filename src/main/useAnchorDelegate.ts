import { DOMAttributes, useContext } from 'react';
import { createDelegateContext, DelegateValue } from './createDelegateContext';

const AnchorDelegateContext = createDelegateContext<DOMAttributes<Element>>();

AnchorDelegateContext.context.displayName = 'AnchorDelegateContext';

/**
 * Delegates props and a ref to an underlying anchor element around which a target element is positioned.
 *
 * @group Other
 */
export const AnchorDelegate = AnchorDelegateContext.Provider;

/**
 * Returns props and a ref that must be added to an anchor element.
 *
 * @group Other
 */
export function useAnchorDelegate(): DelegateValue<DOMAttributes<Element>> {
  return useContext(AnchorDelegateContext.context);
}
