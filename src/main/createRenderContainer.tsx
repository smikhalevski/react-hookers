import { PubSub } from 'parallel-universe';
import React, { type EffectCallback, FunctionComponent, Key, ReactElement, ReactNode, useEffect } from 'react';
import { CloseHandlerProvider } from './behaviors/useCloseHandler.js';
import { useFunction } from './useFunction.js';
import { useRerender } from './useRerender.js';
import { emptyArray } from './utils/lang.js';

/**
 * A map from a container component to a render function.
 *
 * @internal
 */
const containers = new WeakMap<FunctionComponent, RenderInContainerCallback>();

/**
 * A function that renders or re-renders an element in a container.
 *
 * @param element The element to render in the container.
 * @returns A callback that unmounts the rendered element. For elements with the same key, the same unmount callback is
 * returned.
 * @group Other
 */
export type RenderInContainerCallback = (element: ReactElement) => () => void;

/**
 * Returns a function that renders or re-renders an element in a container.
 *
 * If an element has a key, rendering updates the already rendered element with the same key.
 *
 * If there is no key, a new element is rendered on each call.
 *
 * Use the {@link useCloseHandler} hook in a rendered component to obtain a callback that unmounts the rendered element.
 *
 * @example
 * // 1. Create a container
 * const MyContainer = createRenderContainer();
 *
 * // 2. Render the container somewhere
 * <MyContainer />
 *
 * // 3. Get a function that renders an element in the container
 * const renderInContainer = getRenderInContainer(MyContainer);
 *
 * // 4. Render an element in the container
 * const unmount = renderInContainer(<div>Hello</div>);
 *
 * @param container A container component created by {@link createRenderContainer}.
 * @returns A function that renders or re-renders an element.
 * @see {@link createRenderContainer}
 * @group Other
 */
export function getRenderInContainer(container: FunctionComponent): RenderInContainerCallback {
  const callback = containers.get(container);

  if (callback === undefined) {
    throw new Error('Must be a render container component');
  }

  return callback;
}

/**
 * Props for a {@link createRenderContainer render container}.
 *
 * @group Other
 */
export interface RenderContainerProps {
  /**
   * Customizes how elements are rendered in the container. Each element has a non-`null` key. Elements are ordered by
   * insertion.
   *
   * @param elements Elements rendered in the container.
   */
  children?: (elements: ReactElement[]) => ReactNode;
}

/**
 * Creates a component that can be used by {@link getRenderInContainer} to render elements.
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
 * A hook that works like {@link getRenderInContainer} and unmounts all rendered elements when the host component
 * unmounts.
 *
 * @group Other
 */
export function useRenderInContainer(container: FunctionComponent): RenderInContainerCallback {
  const manager = useFunction(createRenderInContainerManager, getRenderInContainer(container));

  useEffect(manager.onMounted, [manager]);

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
