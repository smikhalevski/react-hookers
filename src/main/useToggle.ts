import { Dispatch, SetStateAction, useRef, useState } from 'react';

export type ToggleProtocol = [
  enabled: boolean,
  enable: () => void,
  disable: () => void,
  toggle: (enabled?: boolean) => void,
];

/**
 * Returns a boolean flag and functions to toggle its value.
 */
export function useToggle(initialEnabled = false): Readonly<ToggleProtocol> {
  const [enabled, setEnabled] = useState(initialEnabled);

  const manager = (useRef<ReturnType<typeof createToggleManager>>().current ||= createToggleManager(setEnabled));

  return [enabled, manager.enable, manager.disable, manager.toggle];
}

function createToggleManager(setEnabled: Dispatch<SetStateAction<boolean>>) {
  return {
    enable(): void {
      setEnabled(true);
    },
    disable(): void {
      setEnabled(false);
    },
    toggle(enabled?: boolean): void {
      setEnabled(enabled !== undefined ? Boolean(enabled) : value => !value);
    },
  };
}
