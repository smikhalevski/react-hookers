import { SyntheticEvent } from 'react';
import { FocusableElement } from '../types.js';

/**
 * An attribute that replaces `autofocus` for a {@link useFocusScope focus scope}. Expects a boolean value.
 *
 * @group Other
 */
export const DATA_AUTOFOCUS = 'data-autofocus';

/**
 * Returns `true` if event was dispatched from a portal.
 *
 * @param event An event to check.
 * @group Other
 */
export function isPortalEvent(event: SyntheticEvent): boolean {
  return !event.currentTarget.contains(event.target as Element | null);
}

/**
 * Returns `true` if an {@link element} has the right-to-left text direction.
 *
 * @param element An element to check text direction of. If `null` then document text direction is checked.
 * @group Other
 */
export function isRTLElement(element: Element | null = null): boolean {
  return (element === null ? document.dir : window.getComputedStyle(element).direction) === 'rtl';
}

/**
 * Returns the currently focused element or `null` if no element is focused.
 *
 * @group Other
 */
export function getFocusedElement(): FocusableElement | null {
  const element = document.activeElement;

  if (element === null || !document.hasFocus() || element === document.documentElement || element === document.body) {
    return null;
  }
  return element as FocusableElement;
}

/**
 * Sorts elements in the order <kbd>Tab</kbd> key passes focus from element to element.
 *
 * @group Other
 */
export function sortByTabOrder(a: FocusableElement, b: FocusableElement): number {
  return getTabIndex(a) - getTabIndex(b);
}

/**
 * Sorts elements in an order they appear in a document.
 *
 * @group Other
 */
export function sortByDocumentOrder(a: Element, b: Element): number {
  if (a === b) {
    return 0;
  }

  const position = a.compareDocumentPosition(b);

  if ((position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 || (position & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0) {
    return -1;
  }
  if ((position & Node.DOCUMENT_POSITION_PRECEDING) !== 0 || (position & Node.DOCUMENT_POSITION_CONTAINS) !== 0) {
    return 1;
  }
  return 0;
}

/**
 * Sorts elements in an order they visually appear on the screen.
 *
 * @group Other
 */
export function sortByVisualOrder(a: Element, b: Element): number {
  const rectA = a.getBoundingClientRect();
  const rectB = b.getBoundingClientRect();

  return rectB.x - rectA.x || rectA.y - rectB.y;
}

/**
 * Returns `true` if element has focus capability.
 *
 * @param element An element to check.
 * @group Other
 */
export function isFocusable(element: Element): element is FocusableElement {
  return 'focus' in element;
}

/**
 * Returns `true` if an element participates in <kbd>Tab</kbd> navigation.
 *
 * @param element An element to check.
 * @group Other
 */
export function isTabbable(element: FocusableElement): boolean {
  return getTabIndex(element) >= 0;
}

/**
 * Returns `true` if an element is expected to be automatically focused in a {@link useFocusScope focus scope}.
 *
 * @param element An element to check.
 * @group Other
 */
export function isAutoFocusable(element: Element): boolean {
  return element.getAttribute(DATA_AUTOFOCUS) === 'true';
}

/**
 * Returns the normalized tab index of an {@link element}.
 *
 * @param element An element to get tab index of.
 * @group Other
 */
export function getTabIndex(element: FocusableElement): number {
  const { tagName, tabIndex } = element;

  if (
    tabIndex === -1 &&
    (tagName === 'AUDIO' || tagName === 'VIDEO' || tagName === 'DETAILS' || element.hasAttribute('contenteditable')) &&
    !element.hasAttribute('tabindex')
  ) {
    return 0;
  }
  return tabIndex;
}
