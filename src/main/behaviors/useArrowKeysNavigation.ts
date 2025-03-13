import React, { EffectCallback, useLayoutEffect } from 'react';
import { useFunctionOnce } from '../useFunctionOnce';
import { getTextDirection } from '../utils/dom';
import { emptyArray, emptyObject } from '../utils/lang';
import { cursor } from './cursor';
import { focusRing } from './focusRing';
import { FocusControls, OrderedFocusOptions } from './useFocusControls';

/**
 * Focus cycling modifier.
 *
 * @see {@link ArrowKeysNavigationProps.focusCycle}
 * @group Behaviors
 */
export type FocusCycle =
  | 'arrowDownToFirst'
  | 'arrowDownToLast'
  | 'arrowUpToFirst'
  | 'arrowUpToLast'
  | 'arrowRightToNext'
  | 'arrowLeftToPrevious'
  | 'pageUpToFirst'
  | 'pageDownToLast';

/**
 * Props of the {@link useArrowKeysNavigation} hook.
 *
 * @group Behaviors
 */
export interface ArrowKeysNavigationProps extends OrderedFocusOptions {
  /**
   * If `true` then arrow navigation is disabled.
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
   * <dd>Move focus to the first or last element. If {@link focusCycle focus cycling} is enabled it is also
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
  focusCycle?: readonly FocusCycle[];

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
 * const focusControls = useFocusScope(containerRef);
 *
 * useArrowKeysNavigation(focusControls);
 *
 * <div ref={containerRef}>
 *   <input/>
 * </div>
 *
 * @param focusControls Focus controls that are used to move focus around. If `null` then arrow keys are disabled.
 * @param props Arrow keys props.
 * @see {@link FocusScope}
 * @see {@link ArrowKeysNavigation}
 * @see {@link useFocusScope}
 * @see {@link useFocusControls}
 * @group Behaviors
 */
export function useArrowKeysNavigation(
  focusControls: FocusControls | null,
  props: ArrowKeysNavigationProps = emptyObject
): void {
  const manager = useFunctionOnce(createArrowKeysNavigationManager);

  manager.focusControls = focusControls;
  manager.props = props;

  useLayoutEffect(manager.onMounted, emptyArray);
}

interface ArrowKeysNavigationManager {
  focusControls: FocusControls | null;
  props: ArrowKeysNavigationProps;
  onMounted: EffectCallback;
}

function createArrowKeysNavigationManager(): ArrowKeysNavigationManager {
  const handleMounted: EffectCallback = () => registerArrowKeysNavigationManager(manager);

  const manager: ArrowKeysNavigationManager = {
    focusControls: null,
    props: undefined!,
    onMounted: handleMounted,
  };

  return manager;
}

const arrowKeysNavigationManagers: ArrowKeysNavigationManager[] = [];

function registerArrowKeysNavigationManager(manager: ArrowKeysNavigationManager): () => void {
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

  if (!isArrowKeyNavigationEvent(event)) {
    return;
  }

  for (const manager of arrowKeysNavigationManagers) {
    const { focusControls, props } = manager;
    const { isDisabled, orientation, pagingBehavior } = props;

    if (isDisabled || focusControls === null || !focusControls.isActive()) {
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

      focusByKey(focusControls, key, props);

      event.preventDefault();
      break;
    }
  }
}

export function isArrowKeyNavigationEvent(event: React.KeyboardEvent | KeyboardEvent): boolean {
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

function focusByKey(focusControls: FocusControls, key: string, props: ArrowKeysNavigationProps): boolean {
  const { focusCycle, isRTL = getTextDirection() === 'rtl' } = props;

  if (
    (key === KEY_ARROW_UP && focusControls.focusUp(props)) ||
    (key === KEY_ARROW_DOWN && focusControls.focusDown(props)) ||
    (key === KEY_ARROW_LEFT && focusControls.focusLeft(props)) ||
    (key === KEY_ARROW_RIGHT && focusControls.focusRight(props)) ||
    (key === KEY_PAGE_UP && focusControls.focusFirst(props)) ||
    (key === KEY_PAGE_DOWN && focusControls.focusLast(props))
  ) {
    return true;
  }

  if (focusCycle === undefined) {
    return false;
  }

  for (const type of focusCycle) {
    if (
      (key === KEY_ARROW_UP && type === 'arrowUpToFirst' && focusControls.focusFirst(props)) ||
      (key === KEY_ARROW_UP && type === 'arrowUpToLast' && focusControls.focusLast(props)) ||
      (key === KEY_ARROW_DOWN && type === 'arrowDownToFirst' && focusControls.focusFirst(props)) ||
      (key === KEY_ARROW_DOWN && type === 'arrowDownToLast' && focusControls.focusLast(props)) ||
      (key === KEY_ARROW_RIGHT &&
        type === 'arrowRightToNext' &&
        (isRTL ? focusControls.focusPrevious(props) : focusControls.focusNext(props))) ||
      (key === KEY_ARROW_LEFT &&
        type === 'arrowLeftToPrevious' &&
        (isRTL ? focusControls.focusNext(props) : focusControls.focusPrevious(props))) ||
      (key === KEY_PAGE_UP && type === 'pageUpToFirst' && focusControls.focusFirst(props)) ||
      (key === KEY_PAGE_DOWN && type === 'pageDownToLast' && focusControls.focusLast(props))
    ) {
      return true;
    }
  }

  return false;
}
