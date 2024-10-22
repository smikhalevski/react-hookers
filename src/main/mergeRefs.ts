import { MutableRefObject, RefCallback, RefObject } from 'react';

/**
 * Merges multiple refs into a single callback ref.
 *
 * @param refs Refs to merge.
 * @template R Refs to merge.
 */
export function mergeRefs<R extends Array<RefObject<any> | RefCallback<any> | null | undefined>>(...refs: R): R[number];

export function mergeRefs() {
  let ref = arguments[0];

  for (let i = 1; i < arguments.length; ++i) {
    const refI = arguments[i];

    ref = ref === undefined || ref === null ? refI : refI === undefined || refI === null ? ref : unionRefs(ref, refI);
  }

  return ref;
}

function unionRefs(
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
