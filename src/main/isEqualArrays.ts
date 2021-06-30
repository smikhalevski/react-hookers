export function isEqualArrays(arr1: ReadonlyArray<unknown>, arr2: ReadonlyArray<unknown>): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; ++i) {
    if (!Object.is(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
}
