import { PubSub } from 'parallel-universe';
import React, {
  DOMAttributes,
  EffectCallback,
  KeyboardEventHandler,
  PointerEventHandler,
  useLayoutEffect,
  useState,
} from 'react';
import { focusRing } from './focusRing';
import { DOMEventHandler } from '../types';
import { requestFocus } from './useFocus';
import { useFunction } from '../useFunction';
import { emptyArray, emptyObject, noop } from '../utils/lang';
import { isPortalEvent } from '../utils/dom';

const cancelPressPubSub = new PubSub();

/**
 * Cancels press of the currently pressed element.
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
   * Props of an element for which press interactions are tracked.
   *
   * An object which identity never changes between renders.
   */
  pressProps: DOMAttributes<Element>;

  /**
   * `true` if an element is currently pressed.
   */
  isPressed: boolean;
}

/**
 * Props of the {@link usePress} hook.
 *
 * @group Behaviors
 */
export interface PressProps {
  /**
   * If `true` then press events are disabled.
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
   * A handler that is called when the press state changes.
   *
   * @param isPressed `true` if an element is pressed.
   */
  onPressChange?: (isPressed: boolean) => void;
}

/**
 * Handles press interactions across mouse, touch, keyboard, and screen readers.
 *
 * @param props Press props.
 * @returns An object which identity never changes between renders.
 * @group Behaviors
 */
export function usePress(props: PressProps = emptyObject): PressValue {
  const [isPressed, setPressed] = useState(false);

  const manager = useFunction(createPressManager, setPressed);

  manager.props = props;
  manager.value.isPressed = isPressed;

  useLayoutEffect(manager.onMount, emptyArray);
  useLayoutEffect(manager.onUpdate);

  return manager.value;
}

const STATUS_NOT_PRESSED = 0;
const STATUS_PRESSED_BY_POINTER = 1;
const STATUS_PRESSED_BY_KEYBOARD = 2;

interface PressManager {
  props: PressProps;
  value: PressValue;
  onMount: EffectCallback;
  onUpdate: EffectCallback;
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

  const handleMount: EffectCallback = () => {
    const unsubscribeCancelPress = cancelPressPubSub.subscribe(cancel);

    return () => {
      unsubscribeEventListeners();
      unsubscribeCancelPress();
    };
  };

  const handleUpdate: EffectCallback = () => {
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

    // If pressable elements are nested then only the topmost must be pressed
    event.preventDefault();

    status = STATUS_PRESSED_BY_POINTER;
    isOverTarget = true;
    setPressed(true);

    const handlePointerMove: DOMEventHandler<PointerEvent> = event => {
      const { onPressChange, onPressStart, onPressEnd } = manager.props;

      if (event.pointerId !== pointerId || isOverTarget === (isOverTarget = currentTarget.contains(event.target))) {
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

    document.addEventListener('pointercancel', cancel, true);
    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('pointerup', handlePointerUp, true);

    unsubscribeEventListeners = () => {
      unsubscribeEventListeners = noop;
      document.removeEventListener('pointercancel', cancel, true);
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
    };

    onPressChange?.(true);
    onPressStart?.();

    // Also fixes iOS Safari does not focus clicked buttons so manual focus is required
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#clicking_and_focus
    // https://bugs.webkit.org/show_bug.cgi?id=22261
    requestFocus(currentTarget, { isScrollPrevented: true });
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

    // If pressable elements are nested then only the topmost must be pressed
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
    onMount: handleMount,
    onUpdate: handleUpdate,
  };

  return manager;
}

function isKeyboardPressEvent(pressedTarget: Element, event: React.KeyboardEvent | KeyboardEvent): boolean {
  const { key } = event;

  return (
    (key === 'Enter' || key === ' ' || key === 'Space') &&
    // Links are pressed by the Enter key
    (!(pressedTarget.getAttribute('role') === 'link' || pressedTarget.tagName === 'A') || key === 'Enter')
  );
}
