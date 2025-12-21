import React, { Context, createContext, type ReactNode, useContext } from 'react';
import { useFunction } from './useFunction.js';
import { mergeProps } from './utils/mergeProps.js';

/**
 * Props for {@link DelegatedPropsContext.Provider}.
 *
 * @template P Delegated props.
 * @see {@link createDelegatedPropsContext}
 * @group Other
 */
export interface DelegatedPropsProviderProps<P> {
  value: P;

  /**
   * If `true` then if a provider is nested inside another provider of the same delegate context, it _does not_ merge
   * its props with the props from the enclosing provider.
   *
   * **Note:** This property must not change after the first render.
   *
   * @default false
   */
  isIsolated?: boolean;
  children?: ReactNode;
}

/**
 * A context that carries props that can be consumed by descendants of a provider.
 *
 * @template P Delegated props.
 * @see {@link createDelegatedPropsContext}
 * @group Other
 */
export interface DelegatedPropsContext<P> {
  context: Context<P>;
  Provider: (props: DelegatedPropsProviderProps<P>) => ReactNode;
}

/**
 * Creates a context that merges delegated props.
 *
 * If a provider is nested inside another provider of the same delegate context, it merges its props with the props
 * from the enclosing provider.
 *
 * @example
 * // 1. Create a context
 * const MyPropsContext = createDelegatedPropsContext<{ foo: string }>();
 *
 * // 2. Use the context in a component
 * function Bar() {
 *   const delegatedProps = useContext(MyPropsContext.context);
 *
 *   // Use props here
 *   return delegatedProps?.foo;
 * }
 *
 * // 3. Render a provider and delegate props to descendants
 * <MyPropsContext.Provider value={{ foo: 'hello' }}>
 *   <Bar />
 * </MyPropsContext.Provider>
 *
 * @param defaultProps The default props.
 * @template P Delegated props.
 * @returns A context that carries delegated props.
 * @group Other
 * @see {@link useCachedValue}
 */
export function createDelegatedPropsContext<P>(defaultProps: P): DelegatedPropsContext<P>;

/**
 * Creates a context that merges delegated props.
 *
 * If a provider is nested inside another provider of the same delegate context, it merges its props with the props
 * from the enclosing provider.
 *
 * @example
 * // 1. Create a context
 * const MyPropsContext = createDelegatedPropsContext<{ foo: string }>();
 *
 * // 2. Use the context in a component
 * function Bar() {
 *   const delegatedProps = useContext(MyPropsContext.context);
 *
 *   // Use props here
 *   return delegatedProps?.foo;
 * }
 *
 * // 3. Render a provider and delegate props to descendants
 * <MyPropsContext.Provider value={{ foo: 'hello' }}>
 *   <Bar />
 * </MyPropsContext.Provider>
 *
 * @template P Delegated props.
 * @returns A context that carries delegated props.
 * @group Other
 * @see {@link useCachedValue}
 */
export function createDelegatedPropsContext<P>(): DelegatedPropsContext<P | undefined>;

export function createDelegatedPropsContext(defaultProps?: unknown): DelegatedPropsContext<unknown> {
  const context = createContext(defaultProps);

  return {
    context,

    Provider: props => (
      <context.Provider
        value={useFunction(mergeProps, props.isIsolated ? defaultProps : useContext(context), props.value)}
      >
        {props.children}
      </context.Provider>
    ),
  };
}
