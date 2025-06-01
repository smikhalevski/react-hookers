import React, { Context, createContext, forwardRef, ReactNode, Ref, useContext } from 'react';
import { useFunction } from './useFunction.js';
import { emptyObject } from './utils/lang.js';
import { mergeProps } from './utils/mergeProps.js';
import { mergeRefs } from './utils/mergeRefs.js';

/**
 * A value delegated to children of the {@link DelegateContext.Provider}.
 *
 * @template P Delegated props.
 * @template E An element to which props are delegated.
 * @see {@link createDelegateContext}
 * @group Other
 */
export interface DelegateValue<P = {}, E = any> {
  /**
   * Delegated props.
   */
  props?: P;

  /**
   * A reference that must be added to an element to which {@link props} are delegated.
   */
  ref?: Ref<E>;
}

/**
 * Props of the {@link DelegateContext.Provider} component.
 *
 * @template P Delegated props.
 * @template E An element to which props are delegated.
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
 * @template E An element to which props are delegated.
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
 * Context children are re-rendered if {@link DelegateProviderProps.props props} or
 * {@link DelegateProviderProps.ref ref} is changed.
 *
 * If a provider is nested in a provider of the same delegate context, then it merges its props and ref with props and
 * ref received from the enclosing provider.
 *
 * @example
 * // 1. Create a context
 * const MyContext = createDelegateContext<{ foo: string }>();
 *
 * // 2. Use context in a component
 * function Bar() {
 *   const { props, ref } = useContext(MyContext);
 *
 *   // Use props and ref here
 *   return props.foo;
 * }
 *
 * // 3. Render a provider and delegate props and ref to a child component,
 * <MyContext.Provider props={{ foo: 'hello' }}>
 *   <Bar/>
 * </MyContext>
 *
 * @template P Delegated props.
 * @template E An element to which props are delegated.
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
