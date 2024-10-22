import React, { ReactElement, ReactNode, RefObject } from 'react';
import { FocusControlsProvider } from './useFocusControls';
import { FocusScopeProps, useFocusScope } from './useFocusScope';

/**
 * Props of a {@link FocusScope} component.
 */
export interface FocusScopeProviderProps extends FocusScopeProps {
  /**
   * A ref to a container element inside which focus state is managed.
   */
  containerRef: RefObject<Element>;
  children?: ReactNode;
}

/**
 * A component alternative of a {@link useFocusScope} hook.
 *
 * Creates a {@link useFocusScope focus scope} inside a {@link FocusScopeProviderProps.containerRef container}
 * and provides {@link FocusControls} to underlying components.
 */
export function FocusScope(props: FocusScopeProviderProps): ReactElement {
  return (
    <FocusControlsProvider value={useFocusScope(props.containerRef, props)}>{props.children}</FocusControlsProvider>
  );
}

FocusScope.displayName = 'FocusScope';
