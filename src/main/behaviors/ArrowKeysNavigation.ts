import { PropsWithChildren, ReactNode } from 'react';
import { ArrowKeysNavigationProps, useArrowKeysNavigation } from './useArrowKeysNavigation';
import { useFocusControls } from './useFocusControls';

/**
 * The component alternative of the {@link useArrowKeysNavigation} hook.
 *
 * Enables arrow navigation inside an enclosing {@link FocusScope}.
 *
 * @example
 * const containerRef = useRef(null);
 *
 * <FocusScope containerRef={containerRef}>
 *   <ArrowKeysNavigation>
 *     <div ref={containerRef}>
 *       <input/>
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
