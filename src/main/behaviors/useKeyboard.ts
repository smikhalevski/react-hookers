import { DOMAttributes, KeyboardEventHandler } from 'react';
import { useFunction } from '../useFunction';

/**
 * A value returned from the {@link useKeyboard} hook.
 *
 * @group Behaviors
 */
export interface KeyboardValue {
  /**
   * Props of an element for which keyboard is tracked.
   *
   * An object which identity never changes between renders.
   */
  keyboardProps: DOMAttributes<Element>;
}

/**
 * Props of the {@link useKeyboard} hook.
 *
 * @group Behaviors
 */
export interface KeyboardProps {
  /**
   * If `true` keyboard listeners are disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * A handler that is called when a user presses down a keyboard key.
   */
  onKeyDown?: KeyboardEventHandler;

  /**
   * A handler that is called when a user unpressed a keyboard key.
   */
  onKeyUp?: KeyboardEventHandler;
}

/**
 * Handles keyboard events.
 *
 * @param props Keyboard props.
 * @returns An object which identity never changes between renders.
 * @group Behaviors
 */
export function useKeyboard(props: KeyboardProps): KeyboardValue {
  const manager = useFunction(createKeyboardManager);

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
