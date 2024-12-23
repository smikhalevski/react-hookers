import { PubSub } from 'parallel-universe';
import { createContext, useContext } from 'react';
import { die } from './utils/lang';

/**
 * An observable set of values that is used for managing various selections in components.
 *
 * @template T A value stored in a selection.
 * @group Other
 */
export interface Selection<T = unknown> extends Iterable<T> {
  /**
   * The number of values in a selection.
   */
  readonly size: number;

  /**
   * Returns `true` if a selection contains a {@link value}.
   */
  has(value: T): boolean;

  /**
   * Deletes all values from a selection.
   */
  clear(): void;

  /**
   * Adds a value to a selection.
   *
   * @param value A value to add.
   */
  add(value: T): void;

  /**
   * Deletes a value from a selection.
   *
   * @param value A value to delete.
   * @returns `true` if a value was in a selection.
   */
  delete(value: T): boolean;

  /**
   * Subscribes a listener to selection changes.
   *
   * @param listener A listener to subscribe.
   * @returns A callback that unsubscribes a listener.
   */
  subscribe(listener: () => void): () => void;
}

const SelectionContext = createContext<Selection<any> | null>(null);

SelectionContext.displayName = 'SelectionContext';

/**
 * Provides a selection to underlying components.
 *
 * @group Other
 */
export const SelectionProvider = SelectionContext.Provider;

/**
 * Returns the current selection provided by a {@link SelectionProvider}.
 *
 * @template T A value stored in a selection.
 * @group Other
 */
export function useSelection<T>(): Selection<T> {
  return useContext(SelectionContext) || die('No selection provided');
}

/**
 * Creates a {@link Selection}.
 *
 * @param maxSize The maximum number of values that selection may hold. If an excessive item is added, then a selection
 * behaves like a LIFO stack.
 * @param initialValues Initially selected values.
 * @template T A value stored in a selection.
 * @group Other
 */
export function createSelection<T>(maxSize = Infinity, initialValues?: Iterable<T>): Selection<T> {
  let lastValue: T;

  const pubSub = new PubSub();
  const values = new Set<T>();

  if (initialValues !== undefined) {
    for (lastValue of initialValues) {
      if (values.size > maxSize) {
        break;
      }
      values.add(lastValue);
    }
  }

  return {
    get size() {
      return values.size;
    },

    has(value) {
      return values.has(value);
    },

    clear() {
      if (values.size === 0) {
        return;
      }

      values.clear();
      pubSub.publish();
    },

    add(value) {
      if (values.has(value)) {
        return;
      }

      if (values.size + 1 > maxSize) {
        values.delete(lastValue);
      }

      lastValue = value;
      values.add(value);
      pubSub.publish();
    },

    delete(value) {
      if (values.delete(value)) {
        pubSub.publish();
        return true;
      }
      return false;
    },

    subscribe(listener) {
      return pubSub.subscribe(listener);
    },

    [Symbol.iterator]() {
      return values[Symbol.iterator]();
    },
  };
}
