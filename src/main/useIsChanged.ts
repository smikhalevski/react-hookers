import { useSemanticMemo } from './useSemanticMemo';
import { emptyDeps } from './utils';

/**
 * Returns `true` only during the render when deps were changed, consequent renders return `false`.
 *
 * When called without arguments, `useIsChanged` returns `true` only during the first render and `false` for all
 * consequent renders.
 *
 * @param deps The deps to detect change of.
 */
export function useIsChanged(deps = emptyDeps): boolean {
  const ref = useSemanticMemo(createRef, deps);
  const isChanged = ref[0];

  ref[0] = false;

  return isChanged;
}

function createRef() {
  return [true];
}
