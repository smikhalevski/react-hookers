import { createContext, useContext } from 'react';
import { FocusableElement } from '../types.js';
import { RequestFocusOptions } from './useFocus.js';

/**
 * Options for unordered focus movement methods from {@link FocusControls}.
 *
 * @group Behaviors
 */
export interface UnorderedFocusOptions extends RequestFocusOptions {
  /**
   * Returns `true` if an element is allowed to receive focus. By default, all candidates are approved.
   *
   * @see {@link isTabbable}
   * @see {@link isAutoFocusable}
   */
  approveFocusCandidate?: (element: FocusableElement) => boolean;
}

/**
 * Options for ordered focus movement methods from {@link FocusControls}.
 *
 * @group Behaviors
 */
export interface OrderedFocusOptions extends UnorderedFocusOptions {
  /**
   * Sorts candidate elements. By default, elements are sorted in document order.
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
   * If the scope contains the currently focused element, focuses the next element in <kbd>Tab</kbd> order.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusNext(options?: OrderedFocusOptions): boolean;

  /**
   * If the scope contains the currently focused element, focuses the previous element in <kbd>Tab</kbd> order.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusPrevious(options?: OrderedFocusOptions): boolean;

  /**
   * If the scope contains the currently focused element, moves focus to the closest focusable element above it.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusUp(options?: UnorderedFocusOptions): boolean;

  /**
   * If the scope contains the currently focused element, moves focus to the closest focusable element below it.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusDown(options?: UnorderedFocusOptions): boolean;

  /**
   * If the scope contains the currently focused element, moves focus to the closest focusable element to the left.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusLeft(options?: UnorderedFocusOptions): boolean;

  /**
   * If the scope contains the currently focused element, moves focus to the closest focusable element to the right.
   *
   * @param options Focus options.
   * @returns `true` if an element was focused.
   */
  focusRight(options?: UnorderedFocusOptions): boolean;

  /**
   * Returns `true` if the scope contains the focused element, or if the scope is part of an active focus trap.
   */
  isActive(): boolean;

  /**
   * Returns `true` if the currently focused element is contained within the scope container.
   */
  hasFocus(): boolean;
}

const FocusControlsContext = createContext<FocusControls | null>(null);

FocusControlsContext.displayName = 'FocusControlsContext';

/**
 * Provides {@link FocusControls} to descendant components.
 *
 * @see {@link useFocusControls}
 * @group Behaviors
 */
export const FocusControlsProvider = FocusControlsContext.Provider;

/**
 * Returns {@link FocusControls} from the enclosing {@link useFocusScope focus scope},
 * or `null` if there is no enclosing {@link FocusControlsProvider}.
 *
 * @see {@link FocusControlsProvider}
 * @group Behaviors
 */
export function useFocusControls(): FocusControls | null {
  return useContext(FocusControlsContext);
}
