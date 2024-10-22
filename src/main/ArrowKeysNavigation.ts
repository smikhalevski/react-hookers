import { PropsWithChildren, ReactNode } from 'react';
import { ArrowKeysNavigationProps, useArrowKeysNavigation } from './useArrowKeysNavigation';
import { useFocusControls } from './useFocusControls';

/**
 * A component alternative of a {@link useArrowKeysNavigation} hook.
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
 */
export function ArrowKeysNavigation(props: PropsWithChildren<ArrowKeysNavigationProps>): ReactNode {
  useArrowKeysNavigation(useFocusControls(), props);

  return props.children;
}

ArrowKeysNavigation.displayName = 'ArrowKeysNavigation';
