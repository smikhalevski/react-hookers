import React, { Context, createContext, forwardRef, ReactNode, Ref, useContext } from 'react';
import { useFunction } from './useFunction.js';
import { emptyObject } from './utils/lang.js';
import { mergeProps } from './utils/mergeProps.js';
import { mergeRefs } from './utils/mergeRefs.js';

/**
 * A value delegated to children of {@link DelegateContext.Provider}.
 *
 * @template P Delegated props.
 * @template E The element type to which props are delegated.
 * @see {@link createDelegateContext}
 * @group Other
 */
export interface DelegateValue<P = {}, E = any> {
  /**
   * Delegated props.
   */
  props?: P;

  /**
   * A ref that must be attached to the element to which {@link props} are delegated.
   */
  ref?: Ref<E>;
}

/**
 * Props for {@link DelegateContext.Provider}.
 *
 * @template P Delegated props.
 * @template E The element type to which props are delegated.
 * @see {@link createDelegateContext}
 * @group Other
 */
export interface DelegateProviderProps<P, E> extends DelegateValue<P, E> {
  children?: ReactNode;
}

/**
 * A context that carries props and a ref that can be consumed by descendants of a provider.
 *
 * @template P Delegated props.
 * @template E The element type to which props are delegated.
 * @see {@link createDelegateContext}
 * @group Other
 */
export interface DelegateContext<P, E> {
  context: Context<Readonly<DelegateValue<P, E>>>;
  Provider: (props: DelegateProviderProps<P, E>) => ReactNode;
}

/**
 * Creates a context that merges delegated props and refs.
 *
 * Context consumers re-render when {@link DelegateProviderProps.props props} or {@link DelegateProviderProps.ref ref}
 * changes.
 *
 * If a provider is nested inside another provider of the same delegate context, it merges its props and ref with the
 * props and ref from the enclosing provider.
 *
 * @example
 * // 1. Create a context
 * const MyContext = createDelegateContext<{ foo: string }>();
 *
 * // 2. Use the context in a component
 * function Bar() {
 *   const { props, ref } = useContext(MyContext);
 *
 *   // Use props and ref here
 *   return props?.foo;
 * }
 *
 * // 3. Render a provider and delegate props (and optionally a ref) to descendants
 * <MyContext.Provider props={{ foo: 'hello' }}>
 *   <Bar />
 * </MyContext.Provider>
 *
 * @template P Delegated props.
 * @template E The element type to which props are delegated.
 * @returns A context that carries delegated props and a ref.
 * @group Other
 */
export function createDelegateContext<P = {}, E = any>(): DelegateContext<P, E> {
  const context = createContext<Readonly<DelegateValue<P, E>>>(emptyObject);

  return {
    context,

    Provider: forwardRef((props, ref) => (
      <context.Provider value={useFunction(mergeDelegateValues<P, E>, useContext(context), props.props, ref)}>
        {props.children}
      </context.Provider>
    )),
  };
}

function mergeDelegateValues<P, E>(
  parentValue: DelegateValue<P, E>,
  props: P | undefined,
  ref: Ref<E> | undefined
): DelegateValue<P, E> {
  return Object.freeze({
    props: mergeProps(parentValue.props, props) as P | undefined,
    ref: mergeRefs(parentValue.ref, ref),
  });
}
