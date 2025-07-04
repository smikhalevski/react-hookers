import { EffectCallback, RefObject, useEffect } from 'react';
import { FocusableElement } from '../types.js';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { getFocusedElement, isAutoFocusable, isTabbable, sortByDocumentOrder, sortByTabOrder } from '../utils/dom.js';
import { die, emptyArray, emptyObject } from '../utils/lang.js';
import { focusRing } from './focusRing.js';
import { cancelFocus, requestFocus } from './useFocus.js';
import { FocusControls, OrderedFocusOptions, UnorderedFocusOptions, useFocusControls } from './useFocusControls.js';

/**
 * Props of the {@link useFocusScope} hook.
 *
 * @group Behaviors
 */
export interface FocusScopeProps extends UnorderedFocusOptions {
  /**
   * If `true` then focuses the first {@link approveFocusCandidate approved candidate} element inside a container
   * when a scope is mounted.
   *
   * By default, autofocus is enabled if the {@link focusRing focus ring} is visible.
   */
  isAutofocused?: boolean;

  /**
   * If `true` then focus won't be able to leave the scope.
   *
   * @default false
   */
  isFocusTrap?: boolean;

  /**
   * If `true` then focus is restored to the element that was focused before this scope was mounted.
   *
   * By default, focus is restored if the {@link focusRing focus ring} is visible.
   */
  isFocusRestored?: boolean;
}

/**
 * Creates a focus scope inside a container element and returns controls to move focus around.
 *
 * @example
 * const containerRef = useRef(null);
 * const focusControls = useFocusScope(containerRef);
 *
 * <FocusControlsProvider value={focusControls}>
 *   <div ref={containerRef}>
 *     <input/>
 *   </div>
 * </FocusControlsProvider>
 *
 * @param ref A ref to a container element inside which focus state is managed.
 * @param props Focus scope props.
 * @returns Focus controls that allow to move focus around in a container element. An object which identity never
 * changes between renders.
 * @group Behaviors
 */
export function useFocusScope(ref: RefObject<Element>, props: FocusScopeProps = emptyObject): FocusControls {
  const manager = useFunctionOnce(createFocusScopeManager);

  manager.parentFocusControls = useFocusControls();
  manager.ref = ref;
  manager.props = props;

  useEffect(manager.onMounted, emptyArray);

  return manager.focusControls;
}

interface FocusScopeManager {
  lastFocusedElement: FocusableElement | null;
  parentFocusControls: FocusControls | null;
  ref: RefObject<Element>;
  props: FocusScopeProps;
  focusControls: FocusControls;
  onMounted: EffectCallback;
}

function createFocusScopeManager(): FocusScopeManager {
  const handleMounted: EffectCallback = () => {
    const { isAutofocused = focusRing.isVisible, isFocusTrap, approveFocusCandidate } = manager.props;
    const unregister = registerFocusScopeManager(manager);

    manager.lastFocusedElement = getFocusedElement();

    if (isAutofocused) {
      // Focus the first approved auto-focusable element
      focusControls.focusFirst({
        ...manager.props,

        approveFocusCandidate: element =>
          isAutoFocusable(element) && (approveFocusCandidate === undefined || approveFocusCandidate(element)),
      }) ||
        // Focus the first focusable element
        focusControls.focusFirst(manager.props) ||
        // Hide focus
        (isFocusTrap && cancelFocus());
    } else if (isFocusTrap) {
      cancelFocus();
    }

    return () => {
      const { isFocusRestored = focusRing.isVisible } = manager.props;

      // If an intermediate focus scope unmounts it sets its lastFocusedElement to
      // the next currently mounted scope. For example, when popup is opened from
      // the dropdown that is closed.
      const managerIndex = focusScopeManagers.indexOf(manager) - 1;

      if (managerIndex >= 0) {
        focusScopeManagers[managerIndex].lastFocusedElement = manager.lastFocusedElement;
      }

      unregister();

      if (isFocusRestored) {
        requestFocus(manager.lastFocusedElement);
      }
    };
  };

  const isActive = (): boolean => {
    const focusTrap = getFocusTrap();

    if (focusTrap === null) {
      return hasFocus();
    }

    return containsManager(focusTrap, manager) && (hasFocus() || !containsElement(focusTrap, getFocusedElement()));
  };

  const hasFocus = (): boolean => containsElement(manager, getFocusedElement());

  const focusControls: FocusControls = {
    focusFirst: options => focusAbsolute(manager, false, options),
    focusLast: options => focusAbsolute(manager, true, options),
    focusNext: options => focusRelative(manager, false, options),
    focusPrevious: options => focusRelative(manager, true, options),
    focusUp: options => focusInDirection(manager, DIRECTION_UP, options),
    focusRight: options => focusInDirection(manager, DIRECTION_RIGHT, options),
    focusDown: options => focusInDirection(manager, DIRECTION_DOWN, options),
    focusLeft: options => focusInDirection(manager, DIRECTION_LEFT, options),
    isActive,
    hasFocus,
  };

  const manager: FocusScopeManager = {
    lastFocusedElement: null,
    parentFocusControls: null,
    ref: undefined!,
    props: undefined!,
    focusControls,
    onMounted: handleMounted,
  };

  return manager;
}

const focusScopeManagerByControls = new Map<FocusControls, FocusScopeManager>();
const focusScopeManagers: FocusScopeManager[] = [];

function registerFocusScopeManager(manager: FocusScopeManager): () => void {
  focusScopeManagerByControls.set(manager.focusControls, manager);

  if (focusScopeManagers.unshift(manager) === 1) {
    document.addEventListener('focus', handleFocusTrapRetainFocus, true);
    document.addEventListener('keydown', handleFocusTrapTabKeyDown, true);
    document.addEventListener('pointerdown', handleFocusTrapClickAway, true);
  }

  return () => {
    focusScopeManagerByControls.delete(manager.focusControls);
    focusScopeManagers.splice(focusScopeManagers.indexOf(manager), 1);

    if (focusScopeManagers.length === 0) {
      document.removeEventListener('focus', handleFocusTrapRetainFocus, true);
      document.removeEventListener('keydown', handleFocusTrapTabKeyDown, true);
      document.removeEventListener('pointerdown', handleFocusTrapClickAway, true);
    }
  };
}

function handleFocusTrapRetainFocus(event: FocusEvent): void {
  const focusTrap = getFocusTrap();

  if (focusTrap === null || containsElement(focusTrap, event.target as Element)) {
    return;
  }

  // Return focus back to a focus trap
  if (!requestFocus(event.relatedTarget as Element | null)) {
    cancelFocus();
  }
}

function handleFocusTrapTabKeyDown(event: KeyboardEvent): void {
  if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  const focusTrap = getFocusTrap();

  if (focusTrap === null) {
    return;
  }

  event.preventDefault();

  const options: OrderedFocusOptions = {
    sortFocusCandidates: sortByTabOrder,
    approveFocusCandidate: isTabbable,
  };

  // Focus the next element in the tab order
  if (!focusRelative(focusTrap, event.shiftKey, options)) {
    // Or cycle focus
    focusAbsolute(focusTrap, event.shiftKey, options);
  }
}

function handleFocusTrapClickAway(event: PointerEvent): void {
  const focusTrap = getFocusTrap();

  if (focusTrap === null || containsElement(focusTrap, event.target as Element)) {
    return;
  }

  // Prevent focus and clicks outside a trap container
  event.preventDefault();
}

/**
 * Returns the manager of the topmost focus trap.
 */
function getFocusTrap(): FocusScopeManager | null {
  for (const manager of focusScopeManagers) {
    if (manager.props.isFocusTrap && manager.ref.current !== null) {
      return manager;
    }
  }
  return null;
}

function getParentManager(manager: FocusScopeManager): FocusScopeManager | null {
  return manager.parentFocusControls === null
    ? null
    : focusScopeManagerByControls.get(manager.parentFocusControls) || die('Unexpected parent focus controls');
}

const FOCUS_CANDIDATE_SELECTOR =
  'input,textarea,select,button,details,summary,a[href],[tabindex],audio[controls],video[controls],[contenteditable]';

/**
 * Returns potentially focusable elements under the {@link manager} and all of its descendants. The order of elements is
 * undefined. Returned elements aren't guaranteed to actually be able to receive focus.
 */
function getFocusCandidates(
  manager: FocusScopeManager,
  candidates = new Set<FocusableElement>()
): Set<FocusableElement> {
  const container = manager.ref.current;

  if (!focusScopeManagerByControls.has(manager.focusControls)) {
    // Focus scope isn't mounted yet or was unmounted
    return candidates;
  }

  if (container !== null) {
    const elements = container.querySelectorAll<FocusableElement>(FOCUS_CANDIDATE_SELECTOR);

    if (container.matches(FOCUS_CANDIDATE_SELECTOR)) {
      candidates.add(container as FocusableElement);
    }

    for (let i = 0; i < elements.length; i++) {
      candidates.add(elements.item(i));
    }
  }

  for (const peerManager of focusScopeManagers) {
    if (getParentManager(peerManager) === manager) {
      getFocusCandidates(peerManager, candidates);
    }
  }
  return candidates;
}

/**
 * Returns `true` if a {@link manager} or any of its descendants contain an {@link element}.
 */
function containsElement(manager: FocusScopeManager, element: Element | null): boolean {
  const container = manager.ref.current;

  if (container !== null && container.contains(element)) {
    return true;
  }

  for (const peerManager of focusScopeManagers) {
    if (getParentManager(peerManager) === manager && containsElement(peerManager, element)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns `true` if a {@link parentManager} is equal to or contains a {@link manager}.
 */
function containsManager(parentManager: FocusScopeManager, manager: FocusScopeManager): boolean {
  if (parentManager === manager) {
    return true;
  }

  for (const peerManager of focusScopeManagers) {
    if (getParentManager(peerManager) === parentManager && containsManager(peerManager, manager)) {
      return true;
    }
  }
  return false;
}

/**
 * Focuses a candidate element at given index. If candidate wasn't approved or successfully focused, a subsequent
 * candidate is tried, and so on until there are no candidates, or one of them was focused.
 */
function focusAtIndex(candidates: FocusableElement[], index: number, options: UnorderedFocusOptions): boolean {
  const { approveFocusCandidate } = options;

  for (let i = index; i < candidates.length; ++i) {
    if (
      (approveFocusCandidate === undefined || approveFocusCandidate(candidates[i])) &&
      requestFocus(candidates[i], options)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Focuses the first or the last element in manager containers.
 */
function focusAbsolute(
  manager: FocusScopeManager,
  isReversed: boolean,
  options: OrderedFocusOptions = emptyObject
): boolean {
  const { sortFocusCandidates = sortByDocumentOrder } = options;

  const candidates = Array.from(getFocusCandidates(manager)).sort(sortFocusCandidates);

  if (isReversed) {
    candidates.reverse();
  }

  return focusAtIndex(candidates, 0, options);
}

/**
 * Focuses the next or the previous element relative to the currently focused element in manager containers.
 */
function focusRelative(
  manager: FocusScopeManager,
  isReversed: boolean,
  options: OrderedFocusOptions = emptyObject
): boolean {
  const { sortFocusCandidates = sortByDocumentOrder } = options;
  const focusedElement = getFocusedElement();

  if (focusedElement === null) {
    return false;
  }

  const candidates = Array.from(getFocusCandidates(manager)).sort(sortFocusCandidates);

  if (isReversed) {
    candidates.reverse();
  }

  const index = candidates.indexOf(focusedElement);

  return index !== -1 && focusAtIndex(candidates, index + 1, options);
}

/**
 * Focuses to the closest element in a {@link direction} from the currently focused element.
 */
function focusInDirection(
  manager: FocusScopeManager,
  direction: number,
  options: UnorderedFocusOptions = emptyObject
): boolean {
  const focusedElement = getFocusedElement();

  if (focusedElement === null) {
    return false;
  }

  return focusAtIndex(getElementsInDirection(focusedElement, getFocusCandidates(manager), direction), 0, options);
}

const DIRECTION_UP = 0;
const DIRECTION_RIGHT = 1;
const DIRECTION_DOWN = 2;
const DIRECTION_LEFT = 3;

/**
 * Returns elements from {@link elements} that are in {@link direction} from the {@link pivotElement}, sorted by
 * a perceived proximity.
 */
function getElementsInDirection(
  pivotElement: FocusableElement,
  elements: Set<FocusableElement>,
  direction: number
): FocusableElement[] {
  const rectA = pivotElement.getBoundingClientRect();
  const ax1 = rectA.left;
  const ay1 = rectA.top;
  const ay2 = rectA.bottom;
  const ax2 = rectA.right;

  const elementScores = new Map<FocusableElement, number>();

  for (const element of elements) {
    if (element === pivotElement) {
      continue;
    }

    const rectB = element.getBoundingClientRect();
    const bx1 = rectB.left;
    const by1 = rectB.top;
    const by2 = rectB.bottom;
    const bx2 = rectB.right;

    let majorDistance = 0;
    let crossDistance;
    let crossSize = 0;

    if (direction === DIRECTION_UP && by2 < ay2 && by1 < ay1) {
      majorDistance = ay2 - by2;
      crossSize = bx2 - bx1;
    }

    if (direction === DIRECTION_DOWN && by1 > ay1 && by2 > ay2) {
      majorDistance = by1 - ay1;
      crossSize = bx2 - bx1;
    }

    if (direction === DIRECTION_RIGHT && bx1 > ax1 && bx2 > ax2) {
      majorDistance = bx1 - ax1;
      crossSize = by2 - by1;
    }

    if (direction === DIRECTION_LEFT && bx2 < ax2 && bx1 < ax1) {
      majorDistance = ax2 - bx2;
      crossSize = by2 - by1;
    }

    if (majorDistance === 0) {
      continue;
    }

    if (direction === DIRECTION_UP || direction === DIRECTION_DOWN) {
      crossDistance = bx2 <= ax1 ? ax2 - bx2 : bx1 >= ax2 ? bx1 - ax1 : 0;
    } else {
      crossDistance = by2 <= ay1 ? ay2 - by2 : by1 >= ay2 ? by1 - ay1 : 0;
    }

    const elementScore =
      crossDistance === 0 ? 1e9 / majorDistance : crossSize / (majorDistance + crossDistance * crossDistance);

    if (elementScore > 0) {
      elementScores.set(element, elementScore);
    }
  }

  return Array.from(elementScores.keys()).sort((a, b) => elementScores.get(b)! - elementScores.get(a)!);
}
