import { useFunction } from './useFunction';

/**
 * Returns a copy of an object if any of dependencies have changed between renders.
 *
 * @param value An object to copy.
 * @param deps Dependencies that trigger the copy if changed.
 * @returns A shallow copy of an object, if any of dependencies have changed.
 * @template T An object to copy.
 * @template A Dependencies that trigger the copy if changed.
 */
export const useCopyObject = useFunction.bind(undefined, copyObject) as typeof copyObject;

function copyObject<T extends object>(value: T, ...deps: any[]): T;

function copyObject(value: object) {
  return { ...value };
}
