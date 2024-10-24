import { PubSub } from 'parallel-universe';
import { cloneElement, FunctionComponent, Key, ReactElement, ReactNode, useEffect } from 'react';
import { useRerender } from './useRerender';
import { die, emptyArray } from './utils/lang';

const containers = new WeakMap<FunctionComponent, (element: ReactElement) => () => void>();

/**
 * Props injected into an element rendered inside a {@link useRenderContainer render container}.
 *
 * @group Other
 */
export interface DisposableProps {
  /**
   * A handler that a component should call to unmount itself from a container.
   *
   * This property is injected when a component is rendered by a callback returned from a {@link useRenderContainer}
   * hook. The function identity is unchanged between re-renders.
   */
  onDispose?: () => void;
}

/**
 * Props of a {@link createRenderContainer render container}.
 *
 * @group Other
 */
export interface RenderContainerProps {
  /**
   * Customizes how elements are rendered in a container. Each element has a non-`null` key. Elements are in the order
   * they were added.
   */
  children?: (elements: ReactElement<DisposableProps>[]) => ReactNode;
}

/**
 * Returns a function that renders/re-renders an element in a {@link container}.
 *
 * @example
 * // 1. Create a container
 * const MyContainer = createRenderContainer();
 *
 * // 2. Render a container somewhere
 * <MyContainer/>
 *
 * // 3. Create a function that injects elements into a container
 * const renderInContainer = useRenderContainer(MyContainer);
 *
 * // 4. Render elements inside the container
 * renderInContainer(<div>Hello</div>);
 *
 * @param container A container component created by a {@link createRenderContainer} function.
 * @returns A function that renders/re-renders an element, which returns a callback that unmounts the rendered element.
 * If an element has a key, then the rendered element would update the already rendered element with the same key.
 * If there's no key, then a new element would be rendered on each function call.
 * @see {@link createRenderContainer}
 * @group Other
 */
export function useRenderContainer(
  container: FunctionComponent
): (element: ReactElement<DisposableProps>) => () => void {
  return containers.get(container) || die('Must be a render container component');
}

/**
 * Creates a component that is used by {@link useRenderContainer} to render elements.
 *
 * @see {@link useRenderContainer}
 * @group Other
 */
export function createRenderContainer(): FunctionComponent<RenderContainerProps> {
  const pubSub = new PubSub();
  const elementMap = new Map<Key, ReactElement>();

  const Container: FunctionComponent<RenderContainerProps> = props => {
    const rerender = useRerender();

    useEffect(() => pubSub.subscribe(rerender), emptyArray);

    const elements = Array.from(elementMap.values());

    return props.children === undefined ? elements : props.children(elements);
  };

  containers.set(Container, element => {
    const key = element.key === null ? Math.random() : element.key;

    const dispose = () => {
      if (elementMap.delete(key)) {
        pubSub.publish();
      }
    };

    element = cloneElement(element, typeof element.type === 'string' ? { key } : { key, onDispose: dispose });

    elementMap.set(key, element);

    pubSub.publish();

    return dispose;
  });

  return Container;
}
