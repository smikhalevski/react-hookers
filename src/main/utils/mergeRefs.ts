import type { MutableRefObject, Ref, RefCallback } from 'react';

/**
 * Merges multiple refs into a single callback ref.
 *
 * @param refs Refs to merge.
 * @group Other
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | null | undefined>): Ref<T> | undefined;

export function mergeRefs() {
  let ref = arguments[0];

  for (let i = 1; i < arguments.length; ++i) {
    const refI = arguments[i];

    ref = ref === undefined || ref === null ? refI : refI === undefined || refI === null ? ref : combineRefs(ref, refI);
  }

  return ref === null ? undefined : ref;
}

function combineRefs(
  a: MutableRefObject<unknown> | RefCallback<unknown>,
  b: MutableRefObject<unknown> | RefCallback<unknown>
): RefCallback<unknown> {
  return value => {
    if (typeof a === 'function') {
      a(value);
    } else {
      a.current = value;
    }

    if (typeof b === 'function') {
      b(value);
    } else {
      b.current = value;
    }
  };
}
