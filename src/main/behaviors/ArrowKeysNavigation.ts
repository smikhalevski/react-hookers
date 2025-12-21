import { PropsWithChildren, ReactNode } from 'react';
import { ArrowKeysNavigationProps, useArrowKeysNavigation } from './useArrowKeysNavigation.js';
import { useFocusControls } from './useFocusControls.js';

/**
 * The component-based alternative to the {@link useArrowKeysNavigation} hook.
 *
 * Enables arrow-key navigation within an enclosing {@link FocusScope}.
 *
 * @example
 * const containerRef = useRef(null);
 *
 * <FocusScope containerRef={containerRef}>
 *   <ArrowKeysNavigation>
 *     <div ref={containerRef}>
 *       <input />
 *     </div>
 *   </ArrowKeysNavigation>
 * </FocusScope>
 *
 * @group Behaviors
 */
export function ArrowKeysNavigation(props: PropsWithChildren<ArrowKeysNavigationProps>): ReactNode {
  useArrowKeysNavigation(useFocusControls(), props);

  return props.children;
}

/**
 * @internal
 */
ArrowKeysNavigation.displayName = 'ArrowKeysNavigation';
