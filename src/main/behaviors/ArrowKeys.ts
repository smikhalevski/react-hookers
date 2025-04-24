import { PropsWithChildren, ReactNode } from 'react';
import { ArrowKeysProps, useArrowKeys } from './useArrowKeys';
import { useFocusControls } from './useFocusControls';

/**
 * The component alternative of the {@link useArrowKeys} hook.
 *
 * Enables arrow navigation inside an enclosing {@link FocusScope}.
 *
 * @example
 * const containerRef = useRef(null);
 *
 * <FocusScope containerRef={containerRef}>
 *   <ArrowKeys>
 *     <div ref={containerRef}>
 *       <input/>
 *     </div>
 *   </ArrowKeys>
 * </FocusScope>
 *
 * @group Behaviors
 */
export function ArrowKeys(props: PropsWithChildren<ArrowKeysProps>): ReactNode {
  useArrowKeys(useFocusControls(), props);

  return props.children;
}

/**
 * @internal
 */
ArrowKeys.displayName = 'ArrowKeys';
