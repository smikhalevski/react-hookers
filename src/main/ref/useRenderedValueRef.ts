import {MutableRefObject, useRef} from 'react';

/**
 * Creates ref-like object that keeps ref to the given value. It comes handy if you want to use props in the async
 * context but want to use the actual values but not the ones captured during the render when async context emerged.
 *
 * ```ts
 * const Foo: React.FC<{ onDone(res: Response): void }> = (props) => {
 *   const propsRef = useRenderedValueRef(props);
 *
 *   React.useEffect(() => {
 *     (async () => {
 *       const res = await fetch(…);
 *
 *       // Use the latest provided callback even in if the rerender occurred during the await.
 *       propsRef.current.onDone(res)
 *     })();
 *   }, []);
 *
 *   return null;
 * }
 * ```
 */
export function useRenderedValueRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
