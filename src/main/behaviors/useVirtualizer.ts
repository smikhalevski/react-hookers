import { EffectCallback, RefObject, useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import type { DOMEventHandler } from '../types.js';
import { useFunction } from '../useFunction.js';
import { detectOS } from '../usePlatform.js';
import { BigArray } from '../utils/BigArray.js';
import { isRTLElement } from '../utils/dom.js';
import { emptyArray, emptyObject } from '../utils/lang.js';

/**
 * An item rendered by the {@link useVirtualizer} hook.
 *
 * @group Behaviors
 */
export interface VirtualItem {
  /**
   * An index of an item.
   */
  readonly index: number;

  /**
   * A ref that must be added to an element associated with the item.
   */
  readonly ref: RefObject<Element>;
}

/**
 * An info about the current state of a virtualizer.
 *
 * @see {@link VirtualizerProps.onScroll}
 * @group Behaviors
 */
export interface VirtualizerScrollInfo {
  /**
   * The virtualizer for which a scroll event has occurred.
   */
  virtualizer: Virtualizer;

  /**
   * An index of the first item, inclusive.
   *
   * @see {@link VirtualizerProps.startIndex}
   */
  startIndex: number;

  /**
   * An index of the last item, exclusive.
   *
   * @see {@link VirtualizerProps.endIndex}
   */
  endIndex: number;

  /**
   * A combined size of all items of the current page along the scroll axis.
   */
  pageSize: number;

  /**
   * The first index of a current page, inclusive.
   */
  pageStartIndex: number;

  /**
   * The last index of a current page, exclusive.
   */
  pageEndIndex: number;

  /**
   * A position in pixels at which rendered items must be placed.
   */
  itemsPosition: number;

  /**
   * An index of the first rendered item, inclusive.
   */
  itemsStartIndex: number;

  /**
   * An index of the last rendered item, exclusive.
   */
  itemsEndIndex: number;

  /**
   * An index of the first item that is visible to a user, inclusive.
   */
  visibleItemsStartIndex: number;

  /**
   * An index of the last item that is visible to a user, exclusive.
   */
  visibleItemsEndIndex: number;
}

/**
 * Options of the {@link Virtualizer.scrollToIndex} method.
 *
 * @group Behaviors
 */
export interface VirtualizerScrollToIndexOptions {
  /**
   * A padding to apply to the start of a container in pixels when scrolling to an item.
   *
   * @default 0
   */
  scrollPaddingStart?: number;
}

/**
 * A value returned from the {@link useVirtualizer} hook.
 *
 * @group Behaviors
 */
export interface Virtualizer {
  /**
   * An array of items to render.
   *
   * **Note:** Items in this array may be reused between re-renders.
   */
  items: readonly VirtualItem[];

  /**
   * Returns an estimated total size of the virtualized list in pixels along the scroll axis, based on the total number
   * of items and an estimated average item size.
   */
  estimateTotalSize(): number;

  /**
   * Returns {@link VirtualizerProps.estimateItemSize an estimated item size} in pixels along the scroll axis,
   * or the latest measured item size if item was previously rendered.
   *
   * @param index An index of an item.
   */
  estimateItemSize(index: number): number;

  /**
   * Scrolls virtualizer to an item with the given index.
   *
   * @param index An index of an item.
   * @param options Scroll options.
   */
  scrollToIndex(index: number, options?: VirtualizerScrollToIndexOptions): void;

  /**
   * Scrolls virtualizer to an absolute position.
   *
   * **Note:** The precision of the scroll position isn't guaranteed if an {@link estimateTotalSize} is greater then
   * {@link Number.MAX_SAFE_INTEGER}.
   *
   * @param position A position in pixels to scroll to.
   */
  scrollToPosition(position: number): void;
}

/**
 * Props of the {@link useVirtualizer} hook.
 *
 * @group Behaviors
 */
export interface VirtualizerProps {
  /**
   * An index of the first item, inclusive.
   */
  startIndex: number;

  /**
   * An index of the last item, exclusive.
   */
  endIndex: number;

  /**
   * An estimated average item size in pixels along the scroll axis, or a callback that returns an estimated size by
   * an item index.
   *
   * @default 100
   */
  estimateItemSize?: ((index: number) => number) | number;

  /**
   * The minimum number of pixels that should be rendered offscreen before and after a visible range. Additional items
   * are rendered to fulfill this size.
   *
   * @default 0
   */
  overscanSize?: number;

  /**
   * A reference to a scrollable container element. If omitted then the window is a container.
   */
  containerRef?: RefObject<Element>;

  /**
   * The orientation of the scroll axis.
   *
   * @default "vertical"
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * A padding to apply to the start of a container in pixels.
   *
   * @default 0
   */
  paddingStart?: number;

  /**
   * If `true` then the horizontal scroll events are interpreted as in an RTL environment.
   *
   * By default, RTL is derived from a {@link containerRef container}.
   */
  isRTL?: boolean;

  /**
   * A handler that is called when a {@link containerRef container} is being scrolled.
   *
   * @param info An info about the current state of a virtualizer. This object is reused between handler invocations.
   */
  onScroll: (info: Readonly<VirtualizerScrollInfo>) => void;
}

/**
 * Virtualizes rendering of large lists.
 *
 * @example
 * const containerRef = useRef(null);
 * const pageRef = useRef(null);
 * const itemsRef = useRef(null);
 *
 * const virtualizer = useVirtualizer({
 *   startIndex: 0,
 *   endIndex: Number.MAX_SAFE_INTEGER,
 *   containerRef,
 *
 *   onScroll(info) {
 *     pageRef.current.style.height = info.pageSize + 'px';
 *     itemsRef.current.style.transform = `translateY(${info.itemsPosition}px)`;
 *   },
 * });
 *
 * <div
 *   ref={containerRef}
 *   style={{ height: 300, overflow: 'auto' }}
 * >
 *   <div ref={pageRef}>
 *     <div ref={itemsRef}>
 *       {virtualizer.items.map(item => (
 *         <div
 *           key={item.index}
 *           ref={item.ref}
 *         >
 *           {'Hello'}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * </div>
 *
 * @param props Virtualizer props.
 * @returns An object which identity never changes between renders.
 * @group Behaviors
 */
export function useVirtualizer(props: VirtualizerProps): Virtualizer {
  const [items, setItems] = useState<readonly VirtualItem[]>(emptyArray);
  const manager = useFunction(createVirtualizerManager, setItems);

  manager.props = props;
  manager.value.items = items;

  useLayoutEffect(manager.onMounted, emptyArray);
  useLayoutEffect(manager.onUpdated);

  return manager.value;
}

interface VirtualizerManager {
  props: VirtualizerProps;
  value: Virtualizer;
  onMounted: EffectCallback;
  onUpdated: EffectCallback;
}

function createVirtualizerManager(setItems: (items: readonly VirtualItem[]) => void): VirtualizerManager {
  const info: VirtualizerScrollInfo = {
    virtualizer: undefined!,
    startIndex: 0,
    endIndex: 0,
    pageSize: 0,
    pageStartIndex: 0,
    pageEndIndex: 0,
    itemsPosition: 0,
    itemsStartIndex: 0,
    itemsEndIndex: 0,
    visibleItemsStartIndex: 0,
    visibleItemsEndIndex: 0,
  };

  const elementItemIndexes = new Map<Element, number>();

  let orientation: number;
  let scrollTimeout: number;
  let state: VirtualizerState;
  let resizeObserver: ResizeObserver;
  let renderedStateVersion = -1;

  const syncVirtualizer = (isRenderPending: boolean): void => {
    const { containerRef } = manager.props;
    const prevItems = state.items;

    state.containerSize = measureContainerSize(orientation, containerRef);
    state.actualScrollPosition = max(0, getScrollPosition(orientation, containerRef));

    updateVirtualizer(state, isRenderPending);

    if (state.items === prevItems) {
      applyScroll();
      return;
    }

    if (isRenderPending) {
      renderItems();
    } else {
      flushSync(renderItems);
    }
  };

  const applyScroll = (): void => {
    if (renderedStateVersion !== state.version) {
      renderedStateVersion = state.version;

      info.virtualizer = manager.value;
      info.startIndex = state.startIndex;
      info.endIndex = state.endIndex;
      info.pageSize = state.pageSize;
      info.pageStartIndex = state.pageStartIndex;
      info.pageEndIndex = state.pageEndIndex;
      info.itemsPosition = (orientation | 1) * state.adjustedItemsPosition;
      info.itemsStartIndex = state.itemsStartIndex;
      info.itemsEndIndex = state.itemsEndIndex;
      info.visibleItemsStartIndex = state.visibleItemsStartIndex;
      info.visibleItemsEndIndex = state.visibleItemsEndIndex;

      (0, manager.props.onScroll)(info);
    }

    if (state.requiredScrollPosition !== null) {
      scrollTo(orientation, manager.props.containerRef, state.requiredScrollPosition);
      state.requiredScrollPosition = null;
    }
  };

  const renderItems = (): void => {
    setItems(state.items);
  };

  const handleElementResize: ResizeObserverCallback = (entries, resizeObserver) => {
    for (const entry of entries) {
      const element = entry.target;
      const itemIndex = elementItemIndexes.get(element);

      if (!element.isConnected) {
        // Element was unmounted
        resizeObserver.unobserve(element);
        elementItemIndexes.delete(element);
        continue;
      }

      if (itemIndex !== undefined) {
        state.itemSizeCache.set(itemIndex, measureResizeObserverEntrySize(orientation, entry));
      }
    }

    syncVirtualizer(false);
  };

  const handleWindowResize: DOMEventHandler = () => {
    if (manager.props.containerRef === undefined) {
      syncVirtualizer(false);
    }
  };

  const handleScroll: DOMEventHandler = event => {
    const { containerRef } = manager.props;

    if (event.target !== (containerRef === undefined ? document : containerRef.current)) {
      // Unrelated scroll
      return;
    }

    if (isIOS) {
      // Virtual scroll page changes on iOS can be applied only after inertia scroll has stopped
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, SCROLL_END_DELAY);

      state.isScrolling = true;
    }

    syncVirtualizer(false);
  };

  const handleScrollEnd = (): void => {
    clearTimeout(scrollTimeout);

    state.isScrolling = false;

    syncVirtualizer(false);
  };

  const handleMounted: EffectCallback = () => {
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleWindowResize);
    };
  };

  const handleUpdated: EffectCallback = () => {
    const {
      estimateItemSize = 100,
      overscanSize = 0,
      paddingStart = 0,
      startIndex,
      endIndex,
      containerRef,
      isRTL = isRTLElement(containerRef && containerRef.current),
    } = manager.props;

    if (
      orientation !==
      (orientation = manager.props.orientation !== 'horizontal' ? TOP_TO_BOTTOM : isRTL ? RIGHT_TO_LEFT : LEFT_TO_RIGHT)
    ) {
      const prevState = state;

      state = createVirtualizerState();

      if (prevState !== undefined) {
        // Preserve the pivot position on orientation change

        state.anchorIndex = prevState.pivotIndex;
        state.scrollPaddingStart = prevState.pivotOffset;
        resizeObserver.disconnect();
      }

      elementItemIndexes.clear();
      resizeObserver = new ResizeObserver(handleElementResize);
    }

    state.estimateItemSize = estimateItemSize;
    state.overscanSize = overscanSize;
    state.startIndex = startIndex;
    state.endIndex = max(startIndex, endIndex);
    state.paddingStart = paddingStart;

    applyScroll();

    // Measure and observe new items
    for (const item of state.items) {
      const element = item.ref.current;

      if (element === null || elementItemIndexes.has(element)) {
        // No element, or element is already measured
        continue;
      }

      state.itemSizeCache.set(item.index, measureRectSize(orientation, element.getBoundingClientRect()));

      elementItemIndexes.set(element, item.index);
      resizeObserver.observe(element, resizeObserverOptions);
    }

    // Observe the container element
    if (containerRef !== undefined && containerRef.current !== null) {
      resizeObserver.observe(containerRef.current, resizeObserverOptions);
    }

    syncVirtualizer(true);
  };

  const estimateTotalSize = (): number => {
    if (state === undefined) {
      // Not rendered yet
      return 0;
    }

    const { startIndex, endIndex, itemSizeCache, estimateItemSize } = state;

    let averageSize = 0;

    for (let i = 0; i < MAX_PEEK_COUNT && startIndex + i < endIndex; ++i) {
      averageSize = (averageSize / (i + 1)) * i + itemSizeCache.getOrSet(startIndex + i, estimateItemSize) / (i + 1);
    }

    return trunc((endIndex - startIndex) * averageSize);
  };

  const estimateItemSize = (index: number): number => {
    if (state === undefined || !isSafeInteger(index) || index < state.startIndex || index >= state.endIndex) {
      return 0;
    }
    return state.itemSizeCache.getOrSet(index, state.estimateItemSize);
  };

  const scrollToIndex = (index: number, options: VirtualizerScrollToIndexOptions = emptyObject): void => {
    if (state === undefined) {
      // Not rendered yet
      return;
    }

    const { scrollPaddingStart = 0 } = options;

    state.scrollPaddingStart = scrollPaddingStart;
    state.anchorIndex = max(state.startIndex, min(trunc(index), state.endIndex - 1));

    syncVirtualizer(true);
  };

  const scrollToPosition = (position: number): void => {
    if (state === undefined) {
      // Not rendered yet
      return;
    }

    const { startIndex, endIndex, itemSizeCache, estimateItemSize } = state;

    let anchorIndex = startIndex;
    let anchorPosition = 0;

    while (anchorIndex < endIndex && anchorPosition < position && anchorIndex - startIndex < MAX_PEEK_COUNT) {
      anchorPosition += itemSizeCache.getOrSet(anchorIndex, estimateItemSize);
      anchorIndex++;
    }

    if (anchorIndex < endIndex && anchorPosition < position) {
      // Anchor isn't at the required position, because peek count was exceeded,
      // so fallback to an estimated anchor index and anchor position
      const averageSize = anchorPosition / MAX_PEEK_COUNT;

      anchorIndex = trunc(position / averageSize);
      anchorPosition = anchorIndex * averageSize;
      anchorIndex += startIndex;
    }

    if (anchorIndex >= endIndex) {
      // Prevent excessive re-renders on overflow
      anchorIndex = endIndex - 1;
      anchorPosition = position;
    }

    state.scrollPaddingStart = anchorPosition - position;
    state.anchorIndex = anchorIndex;

    syncVirtualizer(true);
  };

  const manager: VirtualizerManager = {
    props: undefined!,
    value: {
      items: [],
      estimateTotalSize,
      estimateItemSize,
      scrollToIndex,
      scrollToPosition,
    },
    onMounted: handleMounted,
    onUpdated: handleUpdated,
  };

  return manager;
}

const { min, max, trunc } = Math;
const { isSafeInteger } = Number;

const isIOS = detectOS() === 'ios';
const resizeObserverOptions: ResizeObserverOptions = { box: 'border-box' };

const SCROLL_END_DELAY = 150;
const MAX_BROWSER_SCROLL_SIZE = 0xfffffe;
const MIN_PAGE_SIZE = (MAX_BROWSER_SCROLL_SIZE / 20) | 0;
const PAGE_THRESHOLD = 0.15;
const MAX_PEEK_COUNT = 100;

export interface VirtualizerState {
  /**
   * A version that is bumped if {@link Virtualizer.onScroll} must be called to flush changes.
   */
  version: number;

  // Input
  estimateItemSize: ((index: number) => number) | number;
  overscanSize: number;
  containerSize: number;
  actualScrollPosition: number;
  isScrolling: boolean;
  startIndex: number;
  endIndex: number;
  anchorIndex: number | null;
  scrollPaddingStart: number;
  paddingStart: number;

  // Output
  /**
   * Items to render.
   */
  items: readonly VirtualItem[];

  /**
   * A map from an item index to its size.
   */
  itemSizeCache: BigArray<number>;

  /**
   * A position at which items must be rendered, adjusted by the accumulated {@link scrollShift}.
   */
  adjustedItemsPosition: number;

  /**
   * A scroll position that must be applied to a container, or `null` if scroll position shouldn't be changed.
   */
  requiredScrollPosition: number | null;

  /**
   * A size of the current page.
   */
  pageSize: number;

  /**
   * The first index of a current page, inclusive.
   */
  pageStartIndex: number;

  /**
   * The last index of a current page, exclusive.
   */
  pageEndIndex: number;

  /**
   * A position in pixels at which the items must be positioned so it is visible to a user.
   */
  itemsPosition: number;

  /**
   * An index of the first rendered item, inclusive.
   */
  itemsStartIndex: number;

  /**
   * An index of the last rendered item, exclusive.
   */
  itemsEndIndex: number;

  /**
   * An index of the first item that is visible to a user, inclusive.
   */
  visibleItemsStartIndex: number;

  /**
   * An index of the last item that is visible to a user, exclusive.
   */
  visibleItemsEndIndex: number;

  /**
   * An offset of a pivot item from the container top.
   */
  pivotOffset: number;

  /**
   * An index of an item which scroll position must be preserved if item sizes are adjusted after rendering.
   */
  pivotIndex: number;

  /**
   * A difference in estimated and measured sizes of items that precede the pivot item. This shift is applied to
   * a scroll position if {@link isScrolling} is set to `false`.
   */
  scrollShift: number;
}

export function createVirtualizerState(): VirtualizerState {
  return {
    version: 0,

    // Input
    estimateItemSize: 50,
    overscanSize: 0,
    containerSize: 0,
    actualScrollPosition: 0,
    isScrolling: false,
    startIndex: 0,
    endIndex: 0,
    anchorIndex: null,
    scrollPaddingStart: 0,
    paddingStart: 0,

    // Output
    items: [],
    itemSizeCache: new BigArray(),
    adjustedItemsPosition: 0,
    requiredScrollPosition: null,
    pageSize: 0,
    pageStartIndex: 0,
    pageEndIndex: 0,
    itemsPosition: 0,
    itemsStartIndex: 0,
    itemsEndIndex: 0,
    visibleItemsStartIndex: 0,
    visibleItemsEndIndex: 0,
    pivotOffset: 0,
    pivotIndex: 0,
    scrollShift: 0,
  };
}

/**
 * Recalculates items array depending on container scroll state.
 *
 * Terminology:
 *
 * <dl>
 * <dt>Container</dt>
 * <dd>A scrollable element or a window which should be filled with items.</dd>
 *
 * <dt>Page</dt>
 * <dd>
 * A set of items which cumulative size doesn't exceed the maximum supported browser height. Pages are recalculated
 * when scroll is close to 0 or container scroll height.
 * </dd>
 *
 * <dt>Items</dt>
 * <dd>A set of rendered items.</dd>
 *
 * <dt>Pivot item</dt>
 * <dd>An item which scroll position must be preserved if item sizes are adjusted after rendering.</dd>
 *
 * <dt>Anchor item</dt>
 * <dd>An item to which a container must be scrolled.</dd>
 * </dl>
 */
export function updateVirtualizer(state: VirtualizerState, isPivotPreserved: boolean): void {
  const {
    estimateItemSize,
    overscanSize,
    containerSize,
    actualScrollPosition,
    isScrolling,
    startIndex,
    endIndex,
    anchorIndex,
    scrollPaddingStart,
    paddingStart,

    items: prevItems,
    itemSizeCache,
    // adjustedItemsPosition,
    // requiredScrollPosition,
    pageSize: prevPageSize,
    pageStartIndex: prevPageStartIndex,
    pageEndIndex: prevPageEndIndex,
    itemsPosition: prevItemsPosition,
    itemsStartIndex: prevItemsStartIndex,
    itemsEndIndex: prevItemsEndIndex,
    visibleItemsStartIndex: prevVisibleItemsStartIndex,
    visibleItemsEndIndex: prevVisibleItemsEndIndex,
    pivotOffset: prevPivotOffset,
    pivotIndex: prevPivotIndex,
    scrollShift: prevScrollShift,
  } = state;

  let scrollShift = prevScrollShift;

  if (isPivotPreserved) {
    // Ensure that pivot position is visually preserved after items are rendered
    let actualPivotPosition = prevItemsPosition;

    for (let i = prevItemsStartIndex; i < prevPivotIndex && i < endIndex; ++i) {
      actualPivotPosition += itemSizeCache.getOrSet(i, estimateItemSize);
    }

    scrollShift = actualPivotPosition - actualScrollPosition - prevPivotOffset;
  }

  let scrollPosition = max(0, actualScrollPosition + scrollShift);

  let pageSize = 0;
  let pageStartIndex = min(max(prevPageStartIndex, startIndex), endIndex);
  let pageEndIndex = max(startIndex, min(prevPageEndIndex, endIndex));

  let itemsPosition = 0;
  let itemsSize = 0;
  let itemsStartIndex = pageStartIndex;
  let itemsEndIndex = pageStartIndex;

  let visibleItemsStartIndex = pageStartIndex;
  let visibleItemsEndIndex = pageStartIndex;

  let pivotPosition = 0;
  let pivotIndex = pageStartIndex;

  if (anchorIndex !== null) {
    // Ignore the current scroll position and fill the container with the anchored item

    itemsStartIndex = itemsEndIndex = pivotIndex = anchorIndex;
    itemsSize = pivotPosition = 0;

    for (let i = anchorIndex; i < endIndex && itemsSize < containerSize; ++i) {
      itemsSize += itemSizeCache.getOrSet(i, estimateItemSize);
      itemsEndIndex = i + 1;
    }

    for (let i = anchorIndex - 1; i >= startIndex && itemsSize < containerSize; --i) {
      const itemSize = itemSizeCache.getOrSet(i, estimateItemSize);

      pivotPosition += itemSize;
      itemsSize += itemSize;
      itemsStartIndex = i;
    }

    pageSize = itemsSize;
    pageStartIndex = visibleItemsStartIndex = itemsStartIndex;
    pageEndIndex = visibleItemsEndIndex = itemsEndIndex;

    scrollPosition = paddingStart + pivotPosition - scrollPaddingStart;
    scrollShift = 0;
  } else {
    // Calc items that correspond to the current scroll position

    let zeroOffset = 0;

    for (let i = pageStartIndex; i < pageEndIndex && i < endIndex; ++i) {
      const itemSize = itemSizeCache.getOrSet(i, estimateItemSize);

      if (paddingStart + pageSize + itemSize <= scrollPosition) {
        // Item ends before the visible range start

        zeroOffset = itemSize === 0 ? zeroOffset + 1 : 0;

        pageSize += itemSize;
        pivotPosition += itemSize;
        pivotIndex = visibleItemsStartIndex = visibleItemsEndIndex = i + 1;

        if (paddingStart + pageSize <= scrollPosition - overscanSize) {
          // Item ends before the overscan range start
          itemsPosition += itemSize;
          itemsStartIndex = itemsEndIndex = i + 1;
        } else {
          itemsSize += itemSize;
        }
        continue;
      }

      if (paddingStart + pageSize >= scrollPosition + containerSize) {
        // Item starts after the visible range end

        if (paddingStart + pageSize < scrollPosition + containerSize + overscanSize) {
          // Item starts before the overscan range end
          itemsSize += itemSize;
          itemsEndIndex = i + 1;
        }

        pageSize += itemSize;
        continue;
      }

      if (
        paddingStart + pageSize < scrollPosition &&
        paddingStart + pageSize + itemSize < scrollPosition + containerSize
      ) {
        // Item starts before a visible range and ends before a visible range ends
        pivotPosition += itemSize;
        pivotIndex = i + 1;
      }

      // Visible item
      pageSize += itemSize;
      itemsSize += itemSize;
      itemsEndIndex = visibleItemsEndIndex = i + 1;
    }

    // Render items that yielded a size of 0 during the last measurement
    visibleItemsStartIndex -= zeroOffset;
    itemsStartIndex -= zeroOffset;
  }

  let requiredScrollPosition = null;
  let pivotOffset = pivotPosition - scrollPosition;

  if (!isScrolling) {
    const actualItemsPosition = itemsPosition;

    if (
      anchorIndex !== null ||
      actualScrollPosition + containerSize >= paddingStart + prevPageSize * (1 - PAGE_THRESHOLD)
    ) {
      // Go to the next page

      itemsPosition = 0;
      pageStartIndex = itemsStartIndex;
      pageEndIndex = itemsEndIndex;

      // Threshold
      for (
        let i = pageStartIndex - 1;
        i >= startIndex && scrollPosition - actualItemsPosition + itemsPosition < MIN_PAGE_SIZE * PAGE_THRESHOLD;
        --i
      ) {
        itemsPosition += itemSizeCache.getOrSet(i, estimateItemSize);
        pageStartIndex = i;
      }

      pageSize = itemsPosition + itemsSize;

      // Page
      for (let i = pageEndIndex; i < endIndex && paddingStart + pageSize < MIN_PAGE_SIZE; ++i) {
        pageSize += itemSizeCache.getOrSet(i, estimateItemSize);
        pageEndIndex = i + 1;
      }

      // Filler
      for (let i = pageStartIndex - 1; i >= startIndex && paddingStart + pageSize < MIN_PAGE_SIZE; --i) {
        const itemSize = itemSizeCache.getOrSet(i, estimateItemSize);

        itemsPosition += itemSize;
        pageSize += itemSize;
        pageStartIndex = i;
      }
    } else if (actualScrollPosition <= prevPageSize * PAGE_THRESHOLD) {
      // Go to the previous page

      itemsPosition = 0;
      pageSize = 0;
      pageStartIndex = itemsStartIndex;
      pageEndIndex = itemsEndIndex;

      // Threshold
      for (
        let i = pageEndIndex;
        i < endIndex &&
        actualItemsPosition + itemsSize - (scrollPosition + containerSize) + paddingStart + pageSize <
          MIN_PAGE_SIZE * PAGE_THRESHOLD;
        ++i
      ) {
        pageSize += itemSizeCache.getOrSet(i, estimateItemSize);
        pageEndIndex = i + 1;
      }

      pageSize += itemsSize;

      // Page
      for (let i = pageStartIndex - 1; i >= startIndex && paddingStart + pageSize < MIN_PAGE_SIZE; --i) {
        const size = itemSizeCache.getOrSet(i, estimateItemSize);

        itemsPosition += size;
        pageSize += size;
        pageStartIndex = i;
      }

      // Filler
      for (let i = pageEndIndex; i < endIndex && paddingStart + pageSize < MIN_PAGE_SIZE; ++i) {
        pageSize += itemSizeCache.getOrSet(i, estimateItemSize);
        pageEndIndex = i + 1;
      }
    }

    if (scrollShift !== 0 || actualItemsPosition !== itemsPosition) {
      scrollShift = 0;
      requiredScrollPosition = scrollPosition + itemsPosition - actualItemsPosition;
    }

    if (
      // Accommodate new items if page size is insufficient
      ((pageStartIndex < prevPageStartIndex || pageEndIndex > prevPageEndIndex) && prevPageSize < containerSize) ||
      // Non-empty page should not yield empty items
      (prevPageStartIndex === prevPageEndIndex && itemsStartIndex === itemsEndIndex && pageStartIndex !== pageEndIndex)
    ) {
      state.pageStartIndex = pageStartIndex;
      state.pageEndIndex = pageEndIndex;

      updateVirtualizer(state, isPivotPreserved);
      return;
    }
  }

  if (prevItemsStartIndex !== itemsStartIndex || prevItemsEndIndex !== itemsEndIndex) {
    // Populate items items
    const items: VirtualItem[] = [];

    for (let i = itemsStartIndex; i < itemsEndIndex; ++i) {
      if (i >= prevItemsStartIndex && i < prevItemsEndIndex) {
        // Reuse previously rendered items
        items.push(prevItems[i - prevItemsStartIndex]);
      } else {
        items.push({ index: i, ref: { current: null } });
      }
    }

    state.items = items;
  }

  if (
    prevScrollShift !== scrollShift ||
    prevPageSize !== pageSize ||
    prevPageStartIndex !== pageStartIndex ||
    prevPageEndIndex !== pageEndIndex ||
    prevItemsPosition !== itemsPosition ||
    prevItemsStartIndex !== itemsStartIndex ||
    prevItemsEndIndex !== itemsEndIndex ||
    prevVisibleItemsStartIndex !== visibleItemsStartIndex ||
    prevVisibleItemsEndIndex !== visibleItemsEndIndex
  ) {
    state.version++;
  }

  state.anchorIndex = null;
  state.adjustedItemsPosition = itemsPosition - scrollShift;
  state.requiredScrollPosition = actualScrollPosition !== requiredScrollPosition ? requiredScrollPosition : null;
  state.pageSize = pageSize;
  state.pageStartIndex = pageStartIndex;
  state.pageEndIndex = pageEndIndex;
  state.itemsPosition = itemsPosition;
  state.itemsStartIndex = itemsStartIndex;
  state.itemsEndIndex = itemsEndIndex;
  state.visibleItemsStartIndex = visibleItemsStartIndex;
  state.visibleItemsEndIndex = visibleItemsEndIndex;
  state.pivotOffset = pivotOffset;
  state.pivotIndex = pivotIndex;
  state.scrollShift = scrollShift;
}

const TOP_TO_BOTTOM = 0;
const LEFT_TO_RIGHT = 1;
const RIGHT_TO_LEFT = -1;

function measureRectSize(orientation: number, rect: DOMRectReadOnly): number {
  return orientation === TOP_TO_BOTTOM ? rect.height : rect.width;
}

function measureResizeObserverEntrySize(orientation: number, entry: ResizeObserverEntry): number {
  const { borderBoxSize } = entry;

  if (borderBoxSize === undefined) {
    return measureRectSize(orientation, entry.target.getBoundingClientRect());
  }
  return orientation === TOP_TO_BOTTOM ? borderBoxSize[0].blockSize : borderBoxSize[0].inlineSize;
}

function measureContainerSize(orientation: number, containerRef: RefObject<Element> | undefined): number {
  if (containerRef === undefined) {
    // Window
    return orientation === TOP_TO_BOTTOM ? window.innerHeight : window.innerWidth;
  }
  if (containerRef.current === null) {
    // No container
    return 0;
  }
  return orientation === TOP_TO_BOTTOM ? containerRef.current.clientHeight : containerRef.current.clientWidth;
}

function getScrollPosition(orientation: number, containerRef: RefObject<Element> | undefined): number {
  if (containerRef === undefined) {
    // Window
    return orientation === TOP_TO_BOTTOM ? window.scrollY : window.scrollX;
  }
  if (containerRef.current === null) {
    // No container
    return 0;
  }
  return orientation === TOP_TO_BOTTOM ? containerRef.current.scrollTop : orientation * containerRef.current.scrollLeft;
}

function scrollTo(orientation: number, containerRef: RefObject<Element> | undefined, position: number): void {
  const target = containerRef === undefined ? window : containerRef.current;

  target?.scrollTo(
    orientation === TOP_TO_BOTTOM
      ? { behavior: 'instant', top: position }
      : { behavior: 'instant', left: orientation * position }
  );
}
