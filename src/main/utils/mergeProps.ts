import { mergeClassNames } from './mergeClassNames.js';
import { mergeRefs } from './mergeRefs.js';

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Merges multiple props objects into a single object.
 *
 * Properties whose names match `/^on[A-Z]/` and whose values are functions are treated as event handlers and merged
 * into a single function.
 *
 * The `"ref"` property is treated as a ref and merged into a single callback ref.
 *
 * The `"className"` property values are concatenated.
 *
 * @param props The props objects to merge.
 * @template T The props types to merge.
 * @group Other
 */
export function mergeProps<T extends any[]>(...props: T): UnionToIntersection<NonNullable<T[number]>>;

export function mergeProps() {
  if (arguments.length === 0) {
    return;
  }

  if (arguments.length === 1) {
    return arguments[0];
  }

  let props: Record<string, any> | undefined;
  let isCloned = false;

  for (let i = 0; i < arguments.length; ++i) {
    const propsI = arguments[i];

    if (propsI === undefined || propsI === null) {
      continue;
    }

    if (props === undefined) {
      props = propsI;
      continue;
    }

    if (!isCloned) {
      isCloned = true;
      props = { ...props };
    }

    for (const key in propsI) {
      const value = propsI[key];

      if (value === undefined) {
        continue;
      }

      if (
        typeof value === 'function' &&
        key.charCodeAt(0) === 111 /* o */ &&
        key.charCodeAt(1) === 110 /* n */ &&
        key.charCodeAt(2) >= 65 /* A */ &&
        key.charCodeAt(2) <= 90 /* Z */
      ) {
        props[key] = combineEventHandlers(props[key], value);
        continue;
      }

      if (key === 'ref') {
        props.ref = mergeRefs(props.ref, value);
        continue;
      }

      if (key === 'style') {
        props.style = props.style === undefined ? value : { ...props.style, ...value };
        continue;
      }

      props[key] = value;
    }
  }

  if (props !== undefined && 'className' in props) {
    for (let i = 0, value; i < arguments.length; ++i) {
      value = props.className = mergeClassNames(value, arguments[i].className);
    }
  }

  return props;
}

function combineEventHandlers(a: unknown, b: Function): Function {
  if (typeof a !== 'function') {
    return b;
  }

  return function () {
    if (arguments.length === 0) {
      a();
      b();
      return;
    }

    if (arguments.length === 1) {
      a(arguments[0]);
      b(arguments[0]);
      return;
    }

    const args = [];

    for (let i = 0; i < arguments.length; ++i) {
      args.push(arguments[i]);
    }

    a(...args);
    b(...args);
  };
}
