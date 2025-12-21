/**
 * Merges multiple class name values into a single space-separated string.
 *
 * @group Other
 */
export function mergeClassNames(...classNames: Array<string | boolean | null | undefined>): string | undefined;

export function mergeClassNames() {
  let className;

  for (let i = 0; i < arguments.length; ++i) {
    className = concatClassNames(className, arguments[i]);
  }
  return className;
}

function concatClassNames(a: string | undefined, b: unknown): string | undefined {
  if (typeof b !== 'string' || b.length === 0) {
    return a;
  }
  if (a === undefined || a.length === 0) {
    return b;
  }
  return a + ' ' + b;
}
