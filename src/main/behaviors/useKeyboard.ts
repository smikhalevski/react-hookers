import { DOMAttributes, KeyboardEventHandler } from 'react';
import { useFunctionOnce } from '../useFunctionOnce.js';

/**
 * A value returned from the {@link useKeyboard} hook.
 *
 * @group Behaviors
 */
export interface KeyboardValue {
  /**
   * Props for the element for which keyboard interactions are tracked.
   *
   * An object whose identity never changes between renders.
   */
  keyboardProps: DOMAttributes<Element>;
}

/**
 * Props for the {@link useKeyboard} hook.
 *
 * @group Behaviors
 */
export interface KeyboardProps {
  /**
   * If `true`, keyboard listeners are disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * A handler that is called when the user presses a key.
   */
  onKeyDown?: KeyboardEventHandler;

  /**
   * A handler that is called when the user releases a key.
   */
  onKeyUp?: KeyboardEventHandler;
}

/**
 * Handles keyboard events.
 *
 * @param props Keyboard props.
 * @returns An object whose identity never changes between renders.
 * @group Behaviors
 */
export function useKeyboard(props: KeyboardProps): KeyboardValue {
  const manager = useFunctionOnce(createKeyboardManager);

  manager.props = props;

  return manager.value;
}

interface KeyboardManager {
  props: KeyboardProps;
  value: KeyboardValue;
}

function createKeyboardManager(): KeyboardManager {
  const handleKeyDown: KeyboardEventHandler = event => {
    const { isDisabled, onKeyDown } = manager.props;

    if (isDisabled || event.defaultPrevented) {
      return;
    }
    onKeyDown?.(event);
  };

  const handleKeyUp: KeyboardEventHandler = event => {
    const { isDisabled, onKeyUp } = manager.props;

    if (isDisabled || event.defaultPrevented) {
      return;
    }
    onKeyUp?.(event);
  };

  const manager: KeyboardManager = {
    props: undefined!,
    value: {
      keyboardProps: {
        onKeyDown: handleKeyDown,
        onKeyUp: handleKeyUp,
      },
    },
  };

  return manager;
}
