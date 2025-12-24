import { EffectCallback, RefObject, useEffect } from 'react';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { Platform, usePlatform } from '../usePlatform.js';
import { emptyArray } from '../utils/lang.js';

/**
 * Describes a keyboard shortcut configuration.
 *
 * A shortcut is triggered when all specified {@link KeyboardShortcut.keys} are pressed simultaneously,
 * unless the shortcut is disabled.
 *
 * @group Behaviors
 */
export interface KeyboardShortcut {
  /**
   * Keys that must be pressed simultaneously to trigger the {@link onAction action}.
   */
  keys: ReadonlyArray<KeyCode | SyntheticKeyCode | (string & {}) | number>;

  /**
   * If `true`, the shortcut is not captured.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * A handler that is called when all {@link keys} are pressed.
   */
  onAction?: () => void;
}

/**
 * Props for the {@link useKeyboardShortcuts} hook.
 *
 * @group Behaviors
 */
export interface KeyboardShortcutsProps {
  /**
   * The array of shortcuts.
   */
  shortcuts: readonly KeyboardShortcut[];

  /**
   * A container within which a shortcut is active. By default, shortcuts are document-wide.
   */
  containerRef?: RefObject<Element | null>;
}

/**
 * Calls {@link KeyboardShortcut.onAction onAction} when the shortcut is pressed.
 *
 * Characters 0–9 and A–Z are treated as Digit0–Digit9 and KeyA–KeyZ respectively.
 *
 * @example
 * useKeyboardShortcuts({
 *   // Ctrl+J on Windows, Command+J on macOS
 *   shortcut: ['Ctrl', 'J'],
 *   onAction() {
 *     // Handle shortcut action here
 *   },
 * });
 *
 * @group Behaviors
 */
export function useKeyboardShortcuts(props: KeyboardShortcutsProps): void {
  const manager = useFunctionOnce(createKeyboardShortcutsManager);

  manager.platform = usePlatform();
  manager.props = props;

  useEffect(manager.onMounted, emptyArray);
}

interface KeyboardShortcutsManager {
  platform: Platform;
  props: KeyboardShortcutsProps;
  onMounted: EffectCallback;
}

function createKeyboardShortcutsManager(): KeyboardShortcutsManager {
  const handleMounted: EffectCallback = () => registerKeyboardShortcutsManager(manager);

  const manager: KeyboardShortcutsManager = {
    platform: undefined!,
    props: undefined!,
    onMounted: handleMounted,
  };

  return manager;
}

const keyboardShortcutsManagers: KeyboardShortcutsManager[] = [];

function registerKeyboardShortcutsManager(manager: KeyboardShortcutsManager): () => void {
  if (keyboardShortcutsManagers.unshift(manager) === 1) {
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleClearKeys);
  }

  return () => {
    keyboardShortcutsManagers.splice(keyboardShortcutsManagers.indexOf(manager), 1);

    if (keyboardShortcutsManagers.length === 0) {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleClearKeys);
    }
  };
}

const pressedKeys = new Set<string>();
const pressedCodes = new Set<string>();
const pressedKeyCodes = new Set<number>();

function handleKeyDown(event: KeyboardEvent): void {
  if (event.repeat || event.defaultPrevented) {
    return;
  }

  pressedKeys.add(event.key);
  pressedCodes.add(event.code);
  pressedKeyCodes.add(event.keyCode);

  for (const manager of keyboardShortcutsManagers) {
    const { containerRef, shortcuts } = manager.props;

    nextShortcut: for (const shortcut of shortcuts) {
      const { keys, isDisabled, onAction } = shortcut;

      if (
        isDisabled ||
        keys.length !== pressedKeys.size ||
        (containerRef !== undefined &&
          (containerRef.current === null || !containerRef.current.contains(event.target as Element)))
      ) {
        continue;
      }

      for (const key of keys) {
        if (!isKeyPressed(manager, key)) {
          continue nextShortcut;
        }
      }

      event.preventDefault();

      pressedKeys.delete(event.key);
      pressedCodes.delete(event.code);
      pressedKeyCodes.delete(event.keyCode);

      onAction?.();
      return;
    }
  }
}

function handleKeyUp(event: KeyboardEvent): void {
  pressedKeys.delete(event.key);
  pressedCodes.delete(event.code);
  pressedKeyCodes.delete(event.keyCode);
}

function handleClearKeys(): void {
  pressedKeys.clear();
  pressedCodes.clear();
  pressedKeyCodes.clear();
}

function isKeyPressed(manager: KeyboardShortcutsManager, key: string | number): boolean {
  if (typeof key === 'number') {
    return pressedKeyCodes.has(key);
  }

  if (key === 'Ctrl') {
    return pressedKeys.has(manager.platform.isApple ? 'Meta' : 'Control');
  }

  return pressedKeys.has(key) || pressedCodes.has(key) || pressedKeyCodes.has(stableKeyCodes[key]);
}

const stableKeyCodes: Record<string, number> = {
  0: 48,
  1: 49,
  2: 50,
  3: 51,
  4: 52,
  5: 53,
  6: 54,
  7: 55,
  8: 56,
  9: 57,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
};

/**
 * A keyboard key code for a synthetic key that depends on the platform.
 *
 * <dl>
 * <dt>"Ctrl"</dt>
 * <dd>Interpreted as <kbd>Command</kbd> on Apple devices and <kbd>Control</kbd> everywhere else.</dd>
 * </dl>
 *
 * @group Behaviors
 */
export type SyntheticKeyCode = 'Ctrl';

/**
 * Well-known keyboard key codes.
 *
 * @group Behaviors
 */
export type KeyCode =
  | 'Backspace'
  | 'Tab'
  | 'Enter'
  | 'Shift'
  | 'ShiftLeft'
  | 'ShiftRight'
  | 'Control'
  | 'ControlLeft'
  | 'ControlRight'
  | 'Alt'
  | 'AltLeft'
  | 'AltRight'
  | 'Pause'
  | 'CapsLock'
  | 'Escape'
  | 'Space'
  | 'PageUp'
  | 'PageDown'
  | 'End'
  | 'Home'
  | 'ArrowLeft'
  | 'ArrowUp'
  | 'ArrowRight'
  | 'ArrowDown'
  | 'PrintScreen'
  | 'Insert'
  | 'Delete'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  // | 'Digit0'
  // | 'Digit1'
  // | 'Digit2'
  // | 'Digit3'
  // | 'Digit4'
  // | 'Digit5'
  // | 'Digit6'
  // | 'Digit7'
  // | 'Digit8'
  // | 'Digit9'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'
  // | 'KeyA'
  // | 'KeyB'
  // | 'KeyC'
  // | 'KeyD'
  // | 'KeyE'
  // | 'KeyF'
  // | 'KeyG'
  // | 'KeyH'
  // | 'KeyI'
  // | 'KeyJ'
  // | 'KeyK'
  // | 'KeyL'
  // | 'KeyM'
  // | 'KeyN'
  // | 'KeyO'
  // | 'KeyP'
  // | 'KeyQ'
  // | 'KeyR'
  // | 'KeyS'
  // | 'KeyT'
  // | 'KeyU'
  // | 'KeyV'
  // | 'KeyW'
  // | 'KeyX'
  // | 'KeyY'
  // | 'KeyZ'
  | 'MetaLeft'
  | 'MetaRight'
  | 'ContextMenu'
  | 'Numpad0'
  | 'Numpad1'
  | 'Numpad2'
  | 'Numpad3'
  | 'Numpad4'
  | 'Numpad5'
  | 'Numpad6'
  | 'Numpad7'
  | 'Numpad8'
  | 'Numpad9'
  | 'NumpadMultiply'
  | 'NumpadAdd'
  | 'NumpadSubtract'
  | 'NumpadDecimal'
  | 'NumpadDivide'
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12'
  | 'NumLock'
  | 'ScrollLock'
  | 'AudioVolumeMute'
  | 'AudioVolumeDown'
  | 'AudioVolumeUp'
  | 'LaunchMediaPlayer'
  | 'LaunchApplication1'
  | 'LaunchApplication2'
  | 'Semicolon'
  | 'Equal'
  | 'Comma'
  | 'Minus'
  | 'Period'
  | 'Slash'
  | 'Backquote'
  | 'BracketLeft'
  | 'Backslash'
  | 'BracketRight'
  | 'Quote';
