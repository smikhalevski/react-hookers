import { useId } from 'react';

/**
 * Return the unique ID of a component.
 *
 * @group Other
 */
export function useUniqueId(): string {
  return useId();
}
