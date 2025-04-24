import { createContext, useContext } from 'react';
import { FocusableElement } from '../types';
import type { MoveControls } from './useArrowKeys';
import { RequestFocusOptions } from './useFocus';

/**
 * Options of unordered focus movement methods from {@link FocusControls}.
 *
 * @group Behaviors
 */
export interface UnorderedFocusOptions extends RequestFocusOptions {
  /**
   * Returns `true` if an {@link element} is allowed to receive focus. By default, all candidates are approved.
   *
   * @see {@link isTabbable}
   * @see {@link isAutoFocusable}
   */
  approveFocusCandidate?: (element: FocusableElement) => boolean;
}

/**
 * Options of ordered focus movement methods from {@link FocusControls}.
 *
 * @group Behaviors
 */
export interface OrderedFocusOptions extends UnorderedFocusOptions {
  /**
   * Sorts elements that are candidates to be focused. By default, elements are sorted in a document order.
   *
   * @see {@link sortByTabOrder}
   * @see {@link sortByVisualOrder}
   * @see {@link sortByDocumentOrder}
   */
  sortFocusCandidates?: (a: FocusableElement, b: FocusableElement) => number;
}

export interface FocusControls extends MoveControls {
  /**
   * Returns `true` if the currently focused element is contained inside the scope container.
   */
  hasFocus(): boolean;
}

const FocusControlsContext = createContext<FocusControls | null>(null);

FocusControlsContext.displayName = 'FocusControlsContext';

/**
 * Provides {@link FocusControls} to underlying children.
 *
 * @see {@link useFocusControls}
 * @group Behaviors
 */
export const FocusControlsProvider = FocusControlsContext.Provider;

/**
 * Returns {@link FocusControls} of the enclosing {@link useFocusScope focus scope}, or `null` if there's no enclosing
 * {@link FocusControlsProvider}.
 *
 * @see {@link FocusControlsProvider}
 * @group Behaviors
 */
export function useFocusControls(): FocusControls | null {
  return useContext(FocusControlsContext);
}
