import { useId } from 'react';

/**
 * Return the unique ID of a component.
 */
export function useUniqueId(): string {
  return useId();
}
