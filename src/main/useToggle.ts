import { Dispatch, EffectCallback, SetStateAction, useRef, useState } from 'react';
import { useInsertionEffect } from './useInsertionEffect';
import { emptyDeps, noop } from './utils';

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
 * @param initialEnabled `true` if then the toggle is initially enabled. Otherwise, toggle is disabled.
 */
export function useToggle(initialEnabled = false): ToggleProtocol {
  const [isEnabled, setEnabled] = useState(initialEnabled);
  const manager = (useRef<ReturnType<typeof createToggleManager>>().current ||= createToggleManager(setEnabled));

  useInsertionEffect(manager.effect, emptyDeps);

  return [isEnabled, manager.enable, manager.disable, manager.toggle];
}

function createToggleManager(setEnabled: Dispatch<SetStateAction<boolean>>) {
  const toggle = (isEnabled: boolean | undefined) => {
    setEnabled(typeof isEnabled === 'boolean' ? isEnabled : isEnabled => !isEnabled);
  };

  let doToggle = toggle;

  const effect: EffectCallback = () => {
    doToggle = toggle;

    return () => {
      doToggle = noop;
    };
  };

  return {
    effect,
    enable() {
      doToggle(true);
    },
    disable() {
      doToggle(false);
    },
    toggle(isEnabled?: boolean) {
      doToggle(isEnabled);
    },
  };
}
