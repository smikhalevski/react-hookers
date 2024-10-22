import { mergeRefs } from './mergeRefs';

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
 */
export function mergeProps<T extends any[]>(...props: T): UnionToIntersection<NonNullable<T[number]>>;

export function mergeProps() {
  if (arguments.length === 0) {
    return;
  }

  if (arguments.length === 1) {
    return arguments[0];
  }

  let props;
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
        props[key] = unionFunctions(props[key], value);
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
      value = props.className = unionClassNames(value, arguments[i].className);
    }
  }

  return props;
}

/**
 * Merges class names into a single string.
 */
export function mergeClassNames(...classNames: Array<string | boolean | null | undefined>): string | undefined;

export function mergeClassNames() {
  let className;

  for (let i = 0; i < arguments.length; ++i) {
    className = unionClassNames(className, arguments[i]);
  }
  return className;
}

function unionFunctions(a: unknown, b: Function): Function {
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

function unionClassNames(a: string | undefined, b: unknown): string | undefined {
  if (typeof b !== 'string' || b.length === 0) {
    return a;
  }
  if (a === undefined || a.length === 0) {
    return b;
  }
  return a + ' ' + b;
}
