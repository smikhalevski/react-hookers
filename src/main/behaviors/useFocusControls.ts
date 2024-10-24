import { createContext, useContext } from 'react';
import { FocusableElement } from '../types';
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

/**
 * Controls that move focus inside a {@link useFocusScope focus scope}.
 *
 * @group Behaviors
 */
export interface FocusControls {
  /**
   * Focuses the first focusable element inside a focus scope.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusFirst(options?: OrderedFocusOptions): boolean;

  /**
   * Focuses the last focusable element inside a focus scope.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusLast(options?: OrderedFocusOptions): boolean;

  /**
   * If focus scope contains the currently focused element, then the next element in <kbd>Tab</kbd> order after it
   * receives focus.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusNext(options?: OrderedFocusOptions): boolean;

  /**
   * If focus scope contains the currently focused element, then the previous element in <kbd>Tab</kbd> order before it
   * receives focus.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusPrevious(options?: OrderedFocusOptions): boolean;

  /**
   * If focus scope contains the currently focused element, then moves focus to the closest focusable element above
   * the currently focused element.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusUp(options?: UnorderedFocusOptions): boolean;

  /**
   * If focus scope contains the currently focused element, then moves focus to the closest focusable element below
   * the currently focused element.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusDown(options?: UnorderedFocusOptions): boolean;

  /**
   * If focus scope contains the currently focused element, then moves focus to the closest focusable element at left
   * side from the currently focused element.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusLeft(options?: UnorderedFocusOptions): boolean;

  /**
   * If focus scope contains the currently focused element, then moves focus to the closest focusable element at right
   * side from the currently focused element.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusRight(options?: UnorderedFocusOptions): boolean;

  /**
   * Returns `true` if a focus scope has focus or is allowed capture focus, because it is a part of the active focus
   * trap which doesn't contain focus.
   */
  isActive(): boolean;

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
