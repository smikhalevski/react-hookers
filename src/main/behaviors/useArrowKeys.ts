import React, { EffectCallback, useLayoutEffect } from 'react';
import { useFunctionOnce } from '../useFunctionOnce';
import { isRTLElement } from '../utils/dom';
import { emptyArray, emptyObject } from '../utils/lang';
import { cursor } from './cursor';
import { focusRing } from './focusRing';

/**
 * Controls that move focus inside a {@link useFocusScope focus scope}.
 *
 * @group Behaviors
 */
export interface MoveControls {
  /**
   * Focuses the first focusable element inside a focus scope.
   *
   * @returns `true` if an element was focused.
   */
  moveToFirst(): boolean;

  /**
   * Focuses the last focusable element inside a focus scope.
   *
   * @returns `true` if an element was focused.
   */
  moveToLast(): boolean;

  /**
   * If focus scope contains the currently focused element, then the next element in <kbd>Tab</kbd> order after it
   * receives focus.
   *
   * @returns `true` if an element was focused.
   */
  moveToNext(): boolean;

  /**
   * If focus scope contains the currently focused element, then the previous element in <kbd>Tab</kbd> order before it
   * receives focus.
   *
   * @returns `true` if an element was focused.
   */
  moveToPrevious(): boolean;

  /**
   * If focus scope contains the currently focused element, then moves focus to the closest focusable element above
   * the currently focused element.
   *
   * @returns `true` if an element was focused.
   */
  moveUp(): boolean;

  /**
   * If focus scope contains the currently focused element, then moves focus to the closest focusable element below
   * the currently focused element.
   *
   * @returns `true` if an element was focused.
   */
  moveDown(): boolean;

  /**
   * If focus scope contains the currently focused element, then moves focus to the closest focusable element at left
   * side from the currently focused element.
   *
   * @returns `true` if an element was focused.
   */
  moveLeft(): boolean;

  /**
   * If focus scope contains the currently focused element, then moves focus to the closest focusable element at right
   * side from the currently focused element.
   *
   * @returns `true` if an element was focused.
   */
  moveRight(): boolean;

  /**
   * Returns `true` if a focus scope contains focused element, or if a focus scope is a part of an active focus trap.
   */
  isActive(): boolean;
}

/**
 * Move cycling modifier.
 *
 * @see {@link ArrowKeysProps.moveCycle}
 * @group Behaviors
 */
export type MoveCycle =
  | 'arrowDownToFirst'
  | 'arrowDownToLast'
  | 'arrowUpToFirst'
  | 'arrowUpToLast'
  | 'arrowRightToNext'
  | 'arrowLeftToPrevious'
  | 'pageUpToFirst'
  | 'pageDownToLast';

/**
 * Props of the {@link useArrowKeys} hook.
 *
 * @group Behaviors
 */
export interface ArrowKeysProps {
  /**
   * If `true` then arrow keys are disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * Navigation orientation:
   *
   * <dl>
   * <dt>"vertical"</dt>
   * <dd>Only up and down navigation is enabled.</dd>
   * <dt>"horizontal"</dt>
   * <dd>Only left and right navigation is enabled.</dd>
   * <dt>"auto"</dt>
   * <dd>Navigation in any direction is enabled.</dd>
   * </dl>
   *
   * @default "auto"
   */
  orientation?: 'vertical' | 'horizontal' | 'auto';

  /**
   * <kbd>PageUp</kbd> and <kbd>PageDown</kbd> keys behavior:
   *
   * <dl>
   * <dt>"focus"</dt>
   * <dd>Move focus to the first or last element. If {@link moveCycle focus cycling} is enabled it is also
   * applied.</dd>
   * <dt>"prevent"</dt>
   * <dd>Paging events are prevented.</dd>
   * <dt>"none"</dt>
   * <dd>Paging events are ignored and default browser behavior may take place.</dd>
   * </dl>
   *
   * @default "none"
   */
  pagingBehavior?: 'focus' | 'prevent' | 'none';

  /**
   * The ordered list of focus cycling modifiers.
   *
   * By default, no focus cycling is done.
   */
  moveCycle?: readonly MoveCycle[];

  /**
   * If `true` then <kbd>ArrowLeft</kbd> and <kbd>ArrowRight</kbd> behavior is mirrored when focus is cycled.
   *
   * By default, RTL is derived a document.
   */
  isRTL?: boolean;
}

/**
 * Enables arrow keys navigation inside a container.
 *
 * @example
 * const containerRef = useRef(null);
 * const moveControls = useFocusScope(containerRef);
 *
 * useArrowKeys(moveControls);
 *
 * <div ref={containerRef}>
 *   <input/>
 * </div>
 *
 * @param moveControls Focus controls that are used to move focus around. If `null` then arrow keys are disabled.
 * @param props Arrow keys props.
 * @see {@link FocusScope}
 * @see {@link ArrowKeys}
 * @see {@link useFocusScope}
 * @see {@link useFocusControls}
 * @group Behaviors
 */
export function useArrowKeys(moveControls: MoveControls | null, props: ArrowKeysProps = emptyObject): void {
  const manager = useFunctionOnce(createArrowKeysManager);

  manager.moveControls = moveControls;
  manager.props = props;

  useLayoutEffect(manager.onMounted, emptyArray);
}

interface ArrowKeysManager {
  moveControls: MoveControls | null;
  props: ArrowKeysProps;
  onMounted: EffectCallback;
}

function createArrowKeysManager(): ArrowKeysManager {
  const handleMounted: EffectCallback = () => registerArrowKeysManager(manager);

  const manager: ArrowKeysManager = {
    moveControls: null,
    props: undefined!,
    onMounted: handleMounted,
  };

  return manager;
}

const arrowKeysNavigationManagers: ArrowKeysManager[] = [];

function registerArrowKeysManager(manager: ArrowKeysManager): () => void {
  if (arrowKeysNavigationManagers.unshift(manager) === 1) {
    document.addEventListener('keydown', handleArrowKeyDown);
  }

  return () => {
    arrowKeysNavigationManagers.splice(arrowKeysNavigationManagers.indexOf(manager), 1);

    if (arrowKeysNavigationManagers.length === 0) {
      document.removeEventListener('keydown', handleArrowKeyDown);
    }
  };
}

const KEY_ARROW_UP = 'ArrowUp';
const KEY_ARROW_DOWN = 'ArrowDown';
const KEY_ARROW_LEFT = 'ArrowLeft';
const KEY_ARROW_RIGHT = 'ArrowRight';
const KEY_PAGE_UP = 'PageUp';
const KEY_PAGE_DOWN = 'PageDown';

function handleArrowKeyDown(event: KeyboardEvent): void {
  const { key } = event;

  if (!isArrowKeyEvent(event)) {
    return;
  }

  for (const manager of arrowKeysNavigationManagers) {
    const { moveControls, props } = manager;
    const { isDisabled, orientation, pagingBehavior } = props;

    if (isDisabled || moveControls === null || !moveControls.isActive()) {
      continue;
    }

    if (pagingBehavior === 'prevent' && (key === KEY_PAGE_UP || key === KEY_PAGE_DOWN)) {
      event.preventDefault();
      break;
    }

    if (
      (pagingBehavior === 'focus' && (key === KEY_PAGE_UP || key === KEY_PAGE_DOWN)) ||
      (orientation !== 'horizontal' && (key === KEY_ARROW_UP || key === KEY_ARROW_DOWN)) ||
      (orientation !== 'vertical' && (key === KEY_ARROW_LEFT || key === KEY_ARROW_RIGHT))
    ) {
      // Deactivate cursor when user is navigating via keyboard to prevent scroll from triggering unexpected hover
      cursor.deactivate();

      focusRing.reveal();

      moveByArrowKey(moveControls, key, props);

      event.preventDefault();
      break;
    }
  }
}

export function isArrowKeyEvent(event: React.KeyboardEvent | KeyboardEvent): boolean {
  const { key } = event;

  return (
    (key === KEY_ARROW_UP ||
      key === KEY_ARROW_DOWN ||
      key === KEY_ARROW_LEFT ||
      key === KEY_ARROW_RIGHT ||
      key === KEY_PAGE_UP ||
      key === KEY_PAGE_DOWN) &&
    !event.defaultPrevented &&
    !event.metaKey
  );
}

function moveByArrowKey(moveControls: MoveControls, key: string, props: ArrowKeysProps): boolean {
  const { moveCycle, isRTL = isRTLElement() } = props;

  if (
    (key === KEY_ARROW_UP && moveControls.moveUp()) ||
    (key === KEY_ARROW_DOWN && moveControls.moveDown()) ||
    (key === KEY_ARROW_LEFT && moveControls.moveLeft()) ||
    (key === KEY_ARROW_RIGHT && moveControls.moveRight()) ||
    (key === KEY_PAGE_UP && moveControls.moveToFirst()) ||
    (key === KEY_PAGE_DOWN && moveControls.moveToLast())
  ) {
    return true;
  }

  if (moveCycle === undefined) {
    return false;
  }

  for (const type of moveCycle) {
    if (
      (key === KEY_ARROW_UP && type === 'arrowUpToFirst' && moveControls.moveToFirst()) ||
      (key === KEY_ARROW_UP && type === 'arrowUpToLast' && moveControls.moveToLast()) ||
      (key === KEY_ARROW_DOWN && type === 'arrowDownToFirst' && moveControls.moveToFirst()) ||
      (key === KEY_ARROW_DOWN && type === 'arrowDownToLast' && moveControls.moveToLast()) ||
      (key === KEY_ARROW_RIGHT &&
        type === 'arrowRightToNext' &&
        (isRTL ? moveControls.moveToPrevious() : moveControls.moveToNext())) ||
      (key === KEY_ARROW_LEFT &&
        type === 'arrowLeftToPrevious' &&
        (isRTL ? moveControls.moveToNext() : moveControls.moveToPrevious())) ||
      (key === KEY_PAGE_UP && type === 'pageUpToFirst' && moveControls.moveToFirst()) ||
      (key === KEY_PAGE_DOWN && type === 'pageDownToLast' && moveControls.moveToLast())
    ) {
      return true;
    }
  }

  return false;
}
