import { useSemanticMemo } from './useSemanticMemo';
import { emptyDeps } from './utils';

/**
 * Returns `true` only during the render when deps were changed, consequent renders return `false`.
 *
 * When called without arguments, returns `true` only during the first render and `false` for all consequent renders.
 *
 * @param deps The deps to detect change of.
 */
export function useChanged(deps = emptyDeps): boolean {
  const manager = useSemanticMemo(createChangedManager, deps);
  const isChanged = manager[0];

  manager[0] = false;

  return isChanged;
}

function createChangedManager() {
  return [true];
}
