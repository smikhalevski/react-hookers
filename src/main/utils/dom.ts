import { SyntheticEvent } from 'react';
import { FocusableElement } from '../types.js';

/**
 * An attribute that replaces `autofocus` for a {@link useFocusScope focus scope}.
 * Expects a boolean value.
 *
 * @group Other
 */
export const DATA_AUTOFOCUS = 'data-autofocus';

/**
 * Returns `true` if the event was dispatched from a portal.
 *
 * @param event The event to check.
 * @group Other
 */
export function isPortalEvent(event: SyntheticEvent): boolean {
  return !event.currentTarget.contains(event.target as Element | null);
}

/**
 * Returns `true` if an element has right-to-left text direction.
 *
 * @param element An element whose text direction should be checked. If `null`, the document text direction is used.
 * @group Other
 */
export function isRTLElement(element: Element | null = null): boolean {
  return (element === null ? document.dir : window.getComputedStyle(element).direction) === 'rtl';
}

/**
 * Returns the currently focused element, or `null` if no element is focused.
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
 * Sorts elements in the order that the <kbd>Tab</kbd> key moves focus.
 *
 * @group Other
 */
export function sortByTabOrder(a: FocusableElement, b: FocusableElement): number {
  return getTabIndex(a) - getTabIndex(b);
}

/**
 * Sorts elements in the order they appear in the document.
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
 * Sorts elements in the order they visually appear on the screen.
 *
 * @group Other
 */
export function sortByVisualOrder(a: Element, b: Element): number {
  const rectA = a.getBoundingClientRect();
  const rectB = b.getBoundingClientRect();

  return rectB.x - rectA.x || rectA.y - rectB.y;
}

/**
 * Returns `true` if an element is capable of receiving focus.
 *
 * @param element The element to check.
 * @group Other
 */
export function isFocusable(element: Element): element is FocusableElement {
  return 'focus' in element;
}

/**
 * Returns `true` if an element participates in <kbd>Tab</kbd> navigation.
 *
 * @param element The element to check.
 * @group Other
 */
export function isTabbable(element: FocusableElement): boolean {
  return getTabIndex(element) >= 0;
}

/**
 * Returns `true` if an element is expected to be automatically focused in a {@link useFocusScope focus scope}.
 *
 * @param element The element to check.
 * @group Other
 */
export function isAutoFocusable(element: Element): boolean {
  return element.getAttribute(DATA_AUTOFOCUS) === 'true';
}

/**
 * Returns the normalized tab index of an element.
 *
 * @param element The element whose tab index should be retrieved.
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
