import React, { ReactElement, ReactNode, RefObject } from 'react';
import { FocusControlsProvider } from './useFocusControls';
import { FocusScopeProps, useFocusScope } from './useFocusScope';

/**
 * Props of a {@link FocusScope} component.
 *
 * @group Behaviors
 */
export interface FocusScopeProviderProps extends FocusScopeProps {
  /**
   * A ref to a container element inside which focus state is managed.
   */
  containerRef: RefObject<Element>;

  /**
   * Children rendered in a focus scope.
   */
  children?: ReactNode;
}

/**
 * The component alternative of the {@link useFocusScope} hook.
 *
 * Creates a {@link useFocusScope focus scope} inside a {@link FocusScopeProviderProps.containerRef container}
 * and provides {@link FocusControls} to underlying components.
 *
 * @see {@link ArrowKeys}
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
