import { Dispatch, SetStateAction, useRef, useState } from 'react';

/**
 * The protocol returned by the {@link useToggle} hook.
 */
export type ToggleProtocol = [
  isEnabled: boolean,
  enable: () => void,
  disable: () => void,
  toggle: (isEnabled?: boolean) => void,
];

/**
 * Returns a boolean flag and functions to toggle its value.
 *
 * @param initialEnabled `true` if teh toggle is initially enabled, or `false` otherwise.
 */
export function useToggle(initialEnabled = false): ToggleProtocol {
  const [isEnabled, setEnabled] = useState(initialEnabled);

  const manager = (useRef<ReturnType<typeof createToggleManager>>().current ||= createToggleManager(setEnabled));

  return [isEnabled, manager.enable, manager.disable, manager.toggle];
}

function createToggleManager(setEnabled: Dispatch<SetStateAction<boolean>>) {
  return {
    enable() {
      setEnabled(true);
    },
    disable() {
      setEnabled(false);
    },
    toggle(isEnabled?: boolean) {
      setEnabled(typeof isEnabled === 'boolean' ? isEnabled : isEnabled => !isEnabled);
    },
  };
}
