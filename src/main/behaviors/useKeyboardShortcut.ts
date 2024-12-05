import { EffectCallback, RefObject, useEffect } from 'react';
import { useFunction } from '../useFunction';
import { Platform, usePlatform } from '../usePlatform';
import { emptyArray } from '../utils/lang';

/**
 * Props of the {@link useKeyboardShortcut} hook.
 *
 * @group Behaviors
 */
export interface KeyboardShortcutProps {
  /**
   * A container inside which a shortcut is applied. By default, a shortcut is document-wide.
   */
  containerRef?: RefObject<Element>;

  /**
   * If `true` then shortcut isn't captured.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * An array of keys that must be simultaneously pressed to call an {@link onAction action}.
   */
  shortcut: ReadonlyArray<KeyCode | SyntheticKeyCode | (string & {}) | number>;

  /**
   * A handler that is called when all keys from a {@link shortcut} are pressed.
   */
  onAction?: () => void;
}

/**
 * Calls an {@link KeyboardShortcutProps.onAction action} if a shortcut is pressed on a keyboard.
 *
 * Characters 0-9 and A-Z are treated as Digit0-Digit9 and KeyA-KeyZ respectively.
 *
 * @example
 * useKeyboardShortcut({
 *   // Ctrl+J on Windows, Command+J on macOS
 *   shortcut: ['Ctrl', 'J'],
 *   onAction() {
 *     // Handle shortcut action here
 *   }
 * });
 *
 * @group Behaviors
 */
export function useKeyboardShortcut(props: KeyboardShortcutProps): void {
  const manager = useFunction(createKeyboardShortcutManager);

  manager.platform = usePlatform();
  manager.props = props;

  useEffect(manager.onMounted, emptyArray);
}

interface KeyboardShortcutManager {
  platform: Platform;
  props: KeyboardShortcutProps;
  onMounted: EffectCallback;
}

function createKeyboardShortcutManager(): KeyboardShortcutManager {
  const handleMounted: EffectCallback = () => registerKeyboardShortcutManager(manager);

  const manager: KeyboardShortcutManager = {
    platform: undefined!,
    props: undefined!,
    onMounted: handleMounted,
  };

  return manager;
}

const keyboardShortcutManagers: KeyboardShortcutManager[] = [];

function registerKeyboardShortcutManager(manager: KeyboardShortcutManager): () => void {
  if (keyboardShortcutManagers.unshift(manager) === 1) {
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleClearKeys);
  }

  return () => {
    keyboardShortcutManagers.splice(keyboardShortcutManagers.indexOf(manager), 1);

    if (keyboardShortcutManagers.length === 0) {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      window.addEventListener('blur', handleClearKeys);
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

  manager: for (const manager of keyboardShortcutManagers) {
    const { isDisabled, containerRef, shortcut, onAction } = manager.props;

    if (
      isDisabled ||
      shortcut.length !== pressedKeys.size ||
      (containerRef !== undefined && (containerRef.current === null || !containerRef.current.contains(event.target)))
    ) {
      continue;
    }

    for (const key of shortcut) {
      if (!isKeyPressed(manager, key)) {
        continue manager;
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

function isKeyPressed(manager: KeyboardShortcutManager, key: string | number): boolean {
  if (typeof key === 'number') {
    return pressedKeyCodes.has(key);
  }

  if (key === 'Ctrl') {
    return pressedKeys.has(manager.platform.isApple ? 'Meta' : 'Ctrl');
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
 * A keyboard key code of a synthetic key that depends on a platform.
 *
 * <dl>
 * <dt>"Ctrl"</dt>
 * <dd>Interpreted as a <kbd>Command</kbd> on Apple devices and <kbd>Control</kbd> everywhere else.</dd>
 * </dl>
 *
 * @group Behaviors
 */
export type SyntheticKeyCode = 'Ctrl';

/**
 * A well-known keyboard key codes.
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
