import {Dispatch, SetStateAction, useRef, useState} from 'react';

export type ToggleProtocol = [value: boolean, enable: () => void, disable: () => void, toggle: (nextValue?: boolean) => void];

/**
 * Returns a boolean flag and functions to toggle its value.
 */
export function useToggle(initialValue = false): Readonly<ToggleProtocol> {
  const [value, setValue] = useState(initialValue);

  const protocol = useRef<ReturnType<typeof createToggleProtocol>>().current ||= createToggleProtocol(setValue);

  protocol[0] = value;

  return protocol;
}

function createToggleProtocol(setValue: Dispatch<SetStateAction<boolean>>): ToggleProtocol {

  const enable = () => setValue(true);

  const disable = () => setValue(false);

  const toggle = (value?: boolean): void => setValue(value != null ? value : (value) => !value);

  return [false, enable, disable, toggle];
}
