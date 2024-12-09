import { PubSub } from 'parallel-universe';
import React, { type EffectCallback, FunctionComponent, Key, ReactElement, ReactNode, useEffect } from 'react';
import { CloseHandlerProvider } from './behaviors/useCloseHandler';
import { useFunctionOnce } from './useFunctionOnce';
import { useRerender } from './useRerender';
import { die, emptyArray } from './utils/lang';

/**
 * A map from a container component to a render function.
 *
 * @internal
 */
const containers = new WeakMap<FunctionComponent, RenderInContainerCallback>();

/**
 * A function that renders/re-renders an element in a container.
 *
 * @param element An element to render in a container.
 * @returns A callback that unmounts the rendered element. For elements with the same key, the same unmount callback is
 * returned.
 */
export type RenderInContainerCallback = (element: ReactElement) => () => void;

/**
 * Returns a function that renders/re-renders an element in a {@link container}.
 *
 * If an element has a key, then the rendered element would update the already rendered element with the same key.
 *
 * If there's no key, then a new element would be rendered on each function call.
 *
 * Use {@link useCloseHandler} hook in a rendered component to acquire a callback that unmounts a rendered element.
 *
 * @example
 * // 1. Create a container
 * const MyContainer = createRenderContainer();
 *
 * // 2. Render a container somewhere
 * <MyContainer/>
 *
 * // 3. Get a function that renders an element in the container
 * const renderInContainer = getRenderInContainer(MyContainer);
 *
 * // 4. Render an element in the container
 * const unmount = renderInContainer(<div>Hello</div>);
 *
 * @param container A container component created by a {@link createRenderContainer} function.
 * @returns A function that renders/re-renders an element.
 * @see {@link createRenderContainer}
 * @group Other
 */
export function getRenderInContainer(container: FunctionComponent): RenderInContainerCallback {
  return containers.get(container) || die('Must be a render container component');
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
   *
   * @param elements Elements that are rendered in a container.
   */
  children?: (elements: ReactElement[]) => ReactNode;
}

/**
 * Creates a component that is used by {@link getRenderInContainer} to render elements.
 *
 * @see {@link getRenderInContainer}
 * @group Other
 */
export function createRenderContainer(): FunctionComponent<RenderContainerProps> {
  const pubSub = new PubSub();
  const elementMap = new Map<Key, ReactElement>();
  const unmountMap = new Map<Key, () => void>();

  const Container: FunctionComponent<RenderContainerProps> = props => {
    const rerender = useRerender();

    useEffect(() => pubSub.subscribe(rerender), emptyArray);

    const elements = Array.from(elementMap.values());

    return props.children === undefined ? elements : props.children(elements);
  };

  const renderInContainer: RenderInContainerCallback = element => {
    const key = element.key === null ? Math.random() : element.key;

    let unmount = unmountMap.get(key);

    if (unmount === undefined) {
      unmount = () => {
        unmountMap.delete(key);

        if (elementMap.delete(key)) {
          pubSub.publish();
        }
      };

      unmountMap.set(key, unmount);
    }

    elementMap.set(
      key,
      <CloseHandlerProvider
        key={key}
        value={unmount}
      >
        {element}
      </CloseHandlerProvider>
    );

    pubSub.publish();

    return unmount;
  };

  containers.set(Container, renderInContainer);

  return Container;
}

/**
 * A hook that works exactly like {@link getRenderInContainer} and unmounts all rendered elements when host component is
 * unmounted.
 */
export function useRenderInContainer(container: FunctionComponent): RenderInContainerCallback {
  const manager = useFunctionOnce(createRenderInContainerManager, getRenderInContainer(container));

  useEffect(manager.onMounted, emptyArray);

  return manager.renderInContainer;
}

interface RenderInContainerManager {
  renderInContainer: RenderInContainerCallback;
  onMounted: EffectCallback;
}

function createRenderInContainerManager(renderInContainer: RenderInContainerCallback): RenderInContainerManager {
  const unmounts = new Set<() => void>();

  return {
    renderInContainer: element => {
      const unmount = renderInContainer(element);
      unmounts.add(unmount);
      return unmount;
    },

    onMounted: () => () => {
      for (const unmount of unmounts) {
        unmount();
      }
    },
  };
}
