import React, { EffectCallback, useLayoutEffect } from 'react';
import { focusRing } from './focusRing';
import { FocusControls, OrderedFocusOptions } from './useFocusControls';
import { useFunction } from '../useFunction';
import { cancelHover } from './useHover';
import { cancelPress } from './usePress';
import { emptyArray, emptyObject } from '../utils/lang';

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
   * If `true` then focus cycles back to the first element after the last element and vice versa.
   *
   * @default false
   */
  isFocusCycled?: boolean;
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
  const manager = useFunction(createArrowKeysNavigationManager);

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
    document.addEventListener('keydown', handleArrowKeyDown, true);
  }

  return () => {
    arrowKeysNavigationManagers.splice(arrowKeysNavigationManagers.indexOf(manager), 1);

    if (arrowKeysNavigationManagers.length === 0) {
      document.removeEventListener('keydown', handleArrowKeyDown, true);
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
  const { target, key } = event;

  if (!isArrowKeyNavigationEvent(event) || target.tagName === 'TEXTAREA') {
    return;
  }

  if (target.tagName === 'INPUT' && target.type === 'text') {
    const { selectionStart, selectionEnd } = target;

    if (
      // Non-empty selection
      selectionStart !== selectionEnd ||
      // Arrows move cursor before the first or after the last character
      !(
        (selectionStart === 0 && (key === KEY_ARROW_LEFT || key === KEY_ARROW_UP)) ||
        (selectionStart === target.value.length && (key === KEY_ARROW_RIGHT || key === KEY_ARROW_DOWN))
      )
    ) {
      return;
    }
  }

  for (const manager of arrowKeysNavigationManagers) {
    const { focusControls, props } = manager;
    const { isDisabled, orientation, isFocusCycled } = props;

    if (isDisabled || focusControls === null || !focusControls.isActive()) {
      continue;
    }

    focusRing.reveal();

    if (
      (orientation !== 'horizontal' &&
        ((key === KEY_ARROW_UP &&
          (focusControls.focusUp(props) || (isFocusCycled && focusControls.focusLast(props)))) ||
          (key === KEY_ARROW_DOWN &&
            (focusControls.focusDown(props) || (isFocusCycled && focusControls.focusFirst(props)))))) ||
      (orientation !== 'vertical' &&
        ((key === KEY_ARROW_LEFT &&
          (focusControls.focusLeft(props) || (isFocusCycled && focusControls.focusLast(props)))) ||
          (key === KEY_ARROW_RIGHT &&
            (focusControls.focusRight(props) || (isFocusCycled && focusControls.focusFirst(props)))))) ||
      (key === KEY_PAGE_UP && focusControls.focusFirst(props)) ||
      (key === KEY_PAGE_DOWN && focusControls.focusLast(props))
    ) {
      event.preventDefault();
      cancelHover();
      cancelPress();
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
