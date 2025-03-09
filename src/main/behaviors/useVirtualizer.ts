import { EffectCallback, RefObject, useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import type { DOMEventHandler } from '../types';
import { useFunction } from '../useFunction';
import { detectOS } from '../usePlatform';
import { BigArray } from '../utils/BigArray';
import { getTextDirection } from '../utils/dom';
import { emptyArray, emptyObject } from '../utils/lang';

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
   * A combined size of all items of the current page along the scroll axis.
   */
  pageSize: number;

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
   * A position at which the rendered zone must be placed.
   */
  zonePosition: number;

  /**
   * An index of the first rendered item, inclusive.
   */
  zoneStartIndex: number;

  /**
   * An index of the last rendered item, exclusive.
   */
  zoneEndIndex: number;

  /**
   * An index of the first item that is visible to a user, inclusive.
   */
  visibleZoneStartIndex: number;

  /**
   * An index of the last item that is visible to a user, exclusive.
   */
  visibleZoneEndIndex: number;
}

/**
 * Options of the {@link Virtualizer.scrollTo} method.
 *
 * @group Behaviors
 */
export interface VirtualizerScrollToOptions {
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
   * **Note:** Items of this array may be reused between re-renders.
   */
  items: readonly VirtualItem[];

  /**
   * Scrolls list to an item with the given index.
   *
   * @param itemIndex An index of an item.
   * @param options Scroll options.
   */
  scrollTo(itemIndex: number, options?: VirtualizerScrollToOptions): void;
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
 * const zoneRef = useRef(null);
 *
 * const virtualizer = useVirtualizer({
 *   startIndex: 0,
 *   endIndex: Number.MAX_SAFE_INTEGER,
 *   containerRef,
 *
 *   onScroll: info => {
 *     pageRef.current.style.height = info.pageSize + 'px';
 *     zoneRef.current.style.transform = `translateY(${info.zonePosition}px)`;
 *   },
 * });
 *
 * <div
 *   ref={containerRef}
 *   style={{ height: 300, overflow: 'auto' }}
 * >
 *   <div ref={pageRef}>
 *     <div ref={zoneRef}>
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
    pageSize: 0,
    startIndex: 0,
    endIndex: 0,
    zonePosition: 0,
    zoneStartIndex: 0,
    zoneEndIndex: 0,
    visibleZoneStartIndex: 0,
    visibleZoneEndIndex: 0,
  };

  const elementItemIndexes = new Map<Element, number>();

  let orientation: number;
  let scrollTimeout: NodeJS.Timeout;
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

      info.pageSize = state.pageSize;
      info.startIndex = state.startIndex;
      info.endIndex = state.endIndex;
      info.zonePosition = (orientation | 1) * state.adjustedZonePosition;
      info.zoneStartIndex = state.zoneStartIndex;
      info.zoneEndIndex = state.zoneEndIndex;
      info.visibleZoneStartIndex = state.visibleZoneStartIndex;
      info.visibleZoneEndIndex = state.visibleZoneEndIndex;

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

  const handleScrollTo = (itemIndex: number, options: VirtualizerScrollToOptions = emptyObject): void => {
    if (typeof itemIndex !== 'number' || itemIndex !== itemIndex) {
      return;
    }

    const { scrollPaddingStart = 0 } = options;

    state.scrollPaddingStart = scrollPaddingStart;
    state.anchorIndex = max(state.startIndex, min(itemIndex, state.endIndex - 1));

    syncVirtualizer(true);
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
      isRTL = getTextDirection(containerRef && containerRef.current) === 'rtl',
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

  const manager: VirtualizerManager = {
    props: undefined!,
    value: {
      items: [],
      scrollTo: handleScrollTo,
    },
    onMounted: handleMounted,
    onUpdated: handleUpdated,
  };

  return manager;
}

const { min, max } = Math;

const isIOS = detectOS() === 'ios';
const resizeObserverOptions: ResizeObserverOptions = { box: 'border-box' };

const SCROLL_END_DELAY = 150;
const MAX_BROWSER_SCROLL_SIZE = 0xfffffe;
const MIN_PAGE_SIZE = (MAX_BROWSER_SCROLL_SIZE / 20) | 0;
const PAGE_THRESHOLD = 0.15;

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
   * A position of a zone adjusted by the accumulated {@link scrollShift}.
   */
  adjustedZonePosition: number;

  /**
   * A scroll position that must be applied to a container.
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
   * A position in pixels at which the zone must be positioned so it is visible to a user.
   */
  zonePosition: number;

  /**
   * An index of the first rendered item, inclusive.
   */
  zoneStartIndex: number;

  /**
   * An index of the last rendered item, exclusive.
   */
  zoneEndIndex: number;

  /**
   * An index of the first item that is visible to a user, inclusive.
   */
  visibleZoneStartIndex: number;

  /**
   * An index of the last item that is visible to a user, exclusive.
   */
  visibleZoneEndIndex: number;

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
    adjustedZonePosition: 0,
    requiredScrollPosition: null,
    pageSize: 0,
    pageStartIndex: 0,
    pageEndIndex: 0,
    zonePosition: 0,
    zoneStartIndex: 0,
    zoneEndIndex: 0,
    visibleZoneStartIndex: 0,
    visibleZoneEndIndex: 0,
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
 * <dt>Zone</dt>
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
    // adjustedZonePosition,
    // requiredScrollPosition,
    pageSize: prevPageSize,
    pageStartIndex: prevPageStartIndex,
    pageEndIndex: prevPageEndIndex,
    zonePosition: prevZonePosition,
    zoneStartIndex: prevZoneStartIndex,
    zoneEndIndex: prevZoneEndIndex,
    visibleZoneStartIndex: prevVisibleZoneStartIndex,
    visibleZoneEndIndex: prevVisibleZoneEndIndex,
    pivotOffset: prevPivotOffset,
    pivotIndex: prevPivotIndex,
    scrollShift: prevScrollShift,
  } = state;

  let scrollShift = prevScrollShift;

  if (isPivotPreserved) {
    // Ensure that pivot position is visually preserved after items are rendered
    let actualPivotPosition = prevZonePosition;

    for (let i = prevZoneStartIndex; i < prevPivotIndex && i < endIndex; ++i) {
      actualPivotPosition += itemSizeCache.getOrSet(i, estimateItemSize);
    }

    scrollShift = actualPivotPosition - actualScrollPosition - prevPivotOffset;
  }

  let scrollPosition = max(0, actualScrollPosition + scrollShift);

  let pageSize = 0;
  let pageStartIndex = min(max(prevPageStartIndex, startIndex), endIndex);
  let pageEndIndex = max(startIndex, min(prevPageEndIndex, endIndex));

  let zonePosition = 0;
  let zoneSize = 0;
  let zoneStartIndex = pageStartIndex;
  let zoneEndIndex = pageStartIndex;

  let visibleZoneStartIndex = pageStartIndex;
  let visibleZoneEndIndex = pageStartIndex;

  let pivotPosition = 0;
  let pivotIndex = pageStartIndex;

  if (anchorIndex !== null) {
    // Ignore the current scroll position and fill the container with the anchored item

    zoneStartIndex = zoneEndIndex = pivotIndex = anchorIndex;
    zoneSize = pivotPosition = 0;

    for (let i = anchorIndex; i < endIndex && zoneSize < containerSize; ++i) {
      zoneSize += itemSizeCache.getOrSet(i, estimateItemSize);
      zoneEndIndex = i + 1;
    }

    for (let i = anchorIndex - 1; i >= startIndex && zoneSize < containerSize; --i) {
      const itemSize = itemSizeCache.getOrSet(i, estimateItemSize);

      pivotPosition += itemSize;
      zoneSize += itemSize;
      zoneStartIndex = i;
    }

    pageSize = zoneSize;
    pageStartIndex = visibleZoneStartIndex = zoneStartIndex;
    pageEndIndex = visibleZoneEndIndex = zoneEndIndex;

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
        pivotIndex = visibleZoneStartIndex = visibleZoneEndIndex = i + 1;

        if (paddingStart + pageSize <= scrollPosition - overscanSize) {
          // Item ends before the overscan range start
          zonePosition += itemSize;
          zoneStartIndex = zoneEndIndex = i + 1;
        } else {
          zoneSize += itemSize;
        }
        continue;
      }

      if (paddingStart + pageSize >= scrollPosition + containerSize) {
        // Item starts after the visible range end

        if (paddingStart + pageSize < scrollPosition + containerSize + overscanSize) {
          // Item starts before the overscan range end
          zoneSize += itemSize;
          zoneEndIndex = i + 1;
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
      zoneSize += itemSize;
      zoneEndIndex = visibleZoneEndIndex = i + 1;
    }

    // Render items that yielded a size of 0 during the last measurement
    visibleZoneStartIndex -= zeroOffset;
    zoneStartIndex -= zeroOffset;
  }

  let requiredScrollPosition = null;
  let pivotOffset = pivotPosition - scrollPosition;

  if (!isScrolling) {
    const actualZonePosition = zonePosition;

    if (
      anchorIndex !== null ||
      actualScrollPosition + containerSize >= paddingStart + prevPageSize * (1 - PAGE_THRESHOLD)
    ) {
      // Go to the next page

      zonePosition = 0;
      pageStartIndex = zoneStartIndex;
      pageEndIndex = zoneEndIndex;

      // Threshold
      for (
        let i = pageStartIndex - 1;
        i >= startIndex && scrollPosition - actualZonePosition + zonePosition < MIN_PAGE_SIZE * PAGE_THRESHOLD;
        --i
      ) {
        zonePosition += itemSizeCache.getOrSet(i, estimateItemSize);
        pageStartIndex = i;
      }

      pageSize = zonePosition + zoneSize;

      // Page
      for (let i = pageEndIndex; i < endIndex && paddingStart + pageSize < MIN_PAGE_SIZE; ++i) {
        pageSize += itemSizeCache.getOrSet(i, estimateItemSize);
        pageEndIndex = i + 1;
      }

      // Filler
      for (let i = pageStartIndex - 1; i >= startIndex && paddingStart + pageSize < MIN_PAGE_SIZE; --i) {
        const itemSize = itemSizeCache.getOrSet(i, estimateItemSize);

        zonePosition += itemSize;
        pageSize += itemSize;
        pageStartIndex = i;
      }
    } else if (actualScrollPosition <= prevPageSize * PAGE_THRESHOLD) {
      // Go to the previous page

      zonePosition = 0;
      pageSize = 0;
      pageStartIndex = zoneStartIndex;
      pageEndIndex = zoneEndIndex;

      // Threshold
      for (
        let i = pageEndIndex;
        i < endIndex &&
        actualZonePosition + zoneSize - (scrollPosition + containerSize) + paddingStart + pageSize <
          MIN_PAGE_SIZE * PAGE_THRESHOLD;
        ++i
      ) {
        pageSize += itemSizeCache.getOrSet(i, estimateItemSize);
        pageEndIndex = i + 1;
      }

      pageSize += zoneSize;

      // Page
      for (let i = pageStartIndex - 1; i >= startIndex && paddingStart + pageSize < MIN_PAGE_SIZE; --i) {
        const size = itemSizeCache.getOrSet(i, estimateItemSize);

        zonePosition += size;
        pageSize += size;
        pageStartIndex = i;
      }

      // Filler
      for (let i = pageEndIndex; i < endIndex && paddingStart + pageSize < MIN_PAGE_SIZE; ++i) {
        pageSize += itemSizeCache.getOrSet(i, estimateItemSize);
        pageEndIndex = i + 1;
      }
    }

    if (scrollShift !== 0 || actualZonePosition !== zonePosition) {
      scrollShift = 0;
      requiredScrollPosition = scrollPosition + zonePosition - actualZonePosition;
    }

    if (
      // Accommodate new items if page size is insufficient
      ((pageStartIndex < prevPageStartIndex || pageEndIndex > prevPageEndIndex) && prevPageSize < containerSize) ||
      // Non-empty page should not yield an empty zone
      (prevPageStartIndex === prevPageEndIndex && zoneStartIndex === zoneEndIndex && pageStartIndex !== pageEndIndex)
    ) {
      state.pageStartIndex = pageStartIndex;
      state.pageEndIndex = pageEndIndex;

      updateVirtualizer(state, isPivotPreserved);
      return;
    }
  }

  if (prevZoneStartIndex !== zoneStartIndex || prevZoneEndIndex !== zoneEndIndex) {
    // Populate zone items
    const items: VirtualItem[] = [];

    for (let i = zoneStartIndex; i < zoneEndIndex; ++i) {
      if (i >= prevZoneStartIndex && i < prevZoneEndIndex) {
        // Reuse previously rendered items
        items.push(prevItems[i - prevZoneStartIndex]);
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
    prevZonePosition !== zonePosition ||
    prevZoneStartIndex !== zoneStartIndex ||
    prevZoneEndIndex !== zoneEndIndex ||
    prevVisibleZoneStartIndex !== visibleZoneStartIndex ||
    prevVisibleZoneEndIndex !== visibleZoneEndIndex
  ) {
    state.version++;
  }

  state.anchorIndex = null;
  state.adjustedZonePosition = zonePosition - scrollShift;
  state.requiredScrollPosition = actualScrollPosition !== requiredScrollPosition ? requiredScrollPosition : null;
  state.pageSize = pageSize;
  state.pageStartIndex = pageStartIndex;
  state.pageEndIndex = pageEndIndex;
  state.zonePosition = zonePosition;
  state.zoneStartIndex = zoneStartIndex;
  state.zoneEndIndex = zoneEndIndex;
  state.visibleZoneStartIndex = visibleZoneStartIndex;
  state.visibleZoneEndIndex = visibleZoneEndIndex;
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

  if (target === null) {
    // No container
    return;
  }
  if (orientation === TOP_TO_BOTTOM) {
    target.scrollTo(0, position);
  } else {
    target.scrollTo(orientation * position, 0);
  }
}
