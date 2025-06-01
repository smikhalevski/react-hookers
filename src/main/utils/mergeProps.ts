import { mergeClassNames } from './mergeClassNames.js';
import { mergeRefs } from './mergeRefs.js';

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Merges multiple props objects into a single object.
 *
 * Properties with names that match `/^on[A-Z]/` and function values are considered event handlers and merged into
 * a single function.
 *
 * `"ref"` properties are considered to store refs and are merged into a single callback ref.
 *
 * `"className"` properties are concatenated.
 *
 * @param props Props to merge.
 * @template T Props to merge.
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
