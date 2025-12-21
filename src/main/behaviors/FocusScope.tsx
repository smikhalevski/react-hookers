import React, { ReactElement, ReactNode, RefObject } from 'react';
import { FocusControlsProvider } from './useFocusControls.js';
import { FocusScopeProps, useFocusScope } from './useFocusScope.js';

/**
 * Props of the {@link FocusScope} component.
 *
 * @group Behaviors
 */
export interface FocusScopeProviderProps extends FocusScopeProps {
  /**
   * A ref to a container element inside which focus state is managed.
   */
  containerRef: RefObject<Element | null>;

  /**
   * Children rendered inside a focus scope.
   */
  children?: ReactNode;
}

/**
 * A component alternative to the {@link useFocusScope} hook.
 *
 * Creates a {@link useFocusScope focus scope} inside a {@link FocusScopeProviderProps.containerRef container}
 * and provides {@link FocusControls} to descendant components.
 *
 * @see {@link ArrowKeysNavigation}
 * @group Behaviors
 */
export function FocusScope(props: FocusScopeProviderProps): ReactElement {
  const focusControls = useFocusScope(props.containerRef, props);

  return <FocusControlsProvider value={focusControls}>{props.children}</FocusControlsProvider>;
}

/**
 * @internal
 */
FocusScope.displayName = 'FocusScope';
