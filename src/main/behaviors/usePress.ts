import { PubSub } from 'parallel-universe';
import React, {
  DOMAttributes,
  EffectCallback,
  KeyboardEventHandler,
  PointerEventHandler,
  useLayoutEffect,
  useState,
} from 'react';
import { DOMEventHandler } from '../types.js';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { isPortalEvent } from '../utils/dom.js';
import { emptyArray, emptyObject, noop } from '../utils/lang.js';
import { cursor } from './cursor.js';
import { focusRing } from './focusRing.js';
import { requestFocus } from './useFocus.js';

const cancelPressPubSub = new PubSub();

/**
 * Cancels the press interaction of the currently pressed element.
 *
 * @see {@link usePress}
 * @group Behaviors
 */
export function cancelPress(): void {
  cancelPressPubSub.publish();
}

/**
 * A value returned from the {@link usePress} hook.
 *
 * @group Behaviors
 */
export interface PressValue {
  /**
   * Props for the element for which press interactions are tracked.
   *
   * An object whose identity never changes between renders.
   */
  pressProps: DOMAttributes<Element>;

  /**
   * `true` if the element is currently pressed.
   */
  isPressed: boolean;
}

/**
 * Props for the {@link usePress} hook.
 *
 * @group Behaviors
 */
export interface PressProps {
  /**
   * If `true`, press interactions are disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * A handler that is called when a press interaction starts.
   */
  onPressStart?: () => void;

  /**
   * A handler that is called when a press interaction ends, either over the target or when the pointer leaves the target.
   */
  onPressEnd?: () => void;

  /**
   * A handler that is called when the press is released over the target.
   */
  onPress?: () => void;

  /**
   * A handler that is called when the pressed state changes.
   *
   * @param isPressed `true` if the element is pressed.
   */
  onPressChange?: (isPressed: boolean) => void;
}

/**
 * Handles press interactions across mouse, touch, keyboard, and screen readers.
 *
 * @param props Press props.
 * @returns An object whose identity never changes between renders.
 * @group Behaviors
 */
export function usePress(props: PressProps = emptyObject): PressValue {
  const [isPressed, setPressed] = useState(false);

  const manager = useFunctionOnce(createPressManager, setPressed);

  manager.props = props;
  manager.value.isPressed = isPressed;

  useLayoutEffect(manager.onMounted, emptyArray);
  useLayoutEffect(manager.onUpdated);

  return manager.value;
}

const STATUS_NOT_PRESSED = 0;
const STATUS_PRESSED_BY_POINTER = 1;
const STATUS_PRESSED_BY_KEYBOARD = 2;

interface PressManager {
  props: PressProps;
  value: PressValue;
  onMounted: EffectCallback;
  onUpdated: EffectCallback;
}

function createPressManager(setPressed: (isPressed: boolean) => void): PressManager {
  let status = STATUS_NOT_PRESSED;
  let isOverTarget = false;
  let unsubscribeEventListeners = noop;

  const cancel = (): void => {
    const { onPressChange, onPressEnd } = manager.props;

    if (status === STATUS_NOT_PRESSED) {
      return;
    }

    unsubscribeEventListeners();

    status = STATUS_NOT_PRESSED;

    if (!isOverTarget) {
      return;
    }

    isOverTarget = false;
    setPressed(false);

    onPressChange?.(false);
    onPressEnd?.();
  };

  const handleMounted: EffectCallback = () => {
    const unsubscribeCancelPress = cancelPressPubSub.subscribe(cancel);

    return () => {
      unsubscribeEventListeners();
      unsubscribeCancelPress();
    };
  };

  const handleUpdated: EffectCallback = () => {
    if (manager.props.isDisabled) {
      cancel();
    }
  };

  const handlePointerDown: PointerEventHandler = event => {
    const { isDisabled, onPressChange, onPressStart } = manager.props;
    const { currentTarget, pointerId } = event;

    if (
      isDisabled ||
      status !== STATUS_NOT_PRESSED ||
      event.defaultPrevented ||
      event.button !== 0 ||
      isPortalEvent(event)
    ) {
      return;
    }

    cancelPress();

    // If pressable elements are nested, only the topmost should handle the press.
    event.preventDefault();

    status = STATUS_PRESSED_BY_POINTER;
    isOverTarget = true;
    setPressed(true);

    const handlePointerMove: DOMEventHandler<PointerEvent> = event => {
      const { onPressChange, onPressStart, onPressEnd } = manager.props;

      if (
        event.pointerId !== pointerId ||
        isOverTarget === (isOverTarget = currentTarget.contains(event.target as Element))
      ) {
        return;
      }

      setPressed(isOverTarget);

      onPressChange?.(isOverTarget);

      if (isOverTarget) {
        onPressStart?.();
      } else {
        onPressEnd?.();
      }
    };

    const handlePointerUp: DOMEventHandler<PointerEvent> = event => {
      const { onPress } = manager.props;

      if (event.pointerId !== pointerId || event.button !== 0) {
        return;
      }

      if (isOverTarget) {
        cancel();
        onPress?.();
      } else {
        cancel();
      }
    };

    const unsubscribeCursor = cursor.subscribe(() => {
      if (!cursor.isActive) {
        // Cancel the press if the cursor was deactivated
        cancel();
      }
    });

    document.addEventListener('pointercancel', cancel, true);
    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('pointerup', handlePointerUp, true);

    unsubscribeEventListeners = () => {
      unsubscribeEventListeners = noop;

      unsubscribeCursor();

      document.removeEventListener('pointercancel', cancel, true);
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('pointerup', handlePointerUp, true);

      window.removeEventListener('blur', cancel);
      document.removeEventListener('focus', cancel, true);
    };

    onPressChange?.(true);
    onPressStart?.();

    // iOS Safari does not focus clicked buttons, so manual focus is required.
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#clicking_and_focus
    // https://bugs.webkit.org/show_bug.cgi?id=22261
    requestFocus(currentTarget, { isScrollPrevented: true });

    // Focus was moved elsewhere
    window.addEventListener('blur', cancel);
    document.addEventListener('focus', cancel, true);
  };

  const handleKeyDown: KeyboardEventHandler = event => {
    const { isDisabled, onPressStart, onPressChange } = manager.props;
    const { currentTarget } = event;

    if (
      isDisabled ||
      status !== STATUS_NOT_PRESSED ||
      event.defaultPrevented ||
      event.repeat ||
      !isKeyboardPressEvent(currentTarget, event) ||
      isPortalEvent(event)
    ) {
      return;
    }

    cancelPress();

    focusRing.reveal();

    // If pressable elements are nested, only the topmost should handle the press
    event.preventDefault();

    status = STATUS_PRESSED_BY_KEYBOARD;
    isOverTarget = true;
    setPressed(true);

    const handleKeyUp: DOMEventHandler<KeyboardEvent> = event => {
      const { isDisabled, onPress } = manager.props;

      if (isDisabled || !isKeyboardPressEvent(currentTarget, event)) {
        return;
      }

      cancel();
      onPress?.();
    };

    document.addEventListener('keyup', handleKeyUp, true);

    unsubscribeEventListeners = () => {
      unsubscribeEventListeners = noop;
      document.removeEventListener('keyup', handleKeyUp, true);
    };

    onPressStart?.();
    onPressChange?.(true);
  };

  const manager: PressManager = {
    props: undefined!,
    value: {
      isPressed: false,
      pressProps: {
        onPointerDown: handlePointerDown,
        onKeyDown: handleKeyDown,
      },
    },
    onMounted: handleMounted,
    onUpdated: handleUpdated,
  };

  return manager;
}

function isKeyboardPressEvent(pressedTarget: Element, event: React.KeyboardEvent | KeyboardEvent): boolean {
  const { key } = event;

  return (
    (key === 'Enter' || key === ' ' || key === 'Space') &&
    // Links are pressed with the Enter key
    (!(pressedTarget.getAttribute('role') === 'link' || pressedTarget.tagName === 'A') || key === 'Enter')
  );
}
