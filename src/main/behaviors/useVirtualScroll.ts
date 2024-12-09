import { EffectCallback, RefObject, useLayoutEffect, useReducer } from 'react';
import type { DOMEventHandler } from '../types';
import { useFunctionOnce } from '../useFunctionOnce';

/**
 * An item rendered by the {@link useVirtualScroll} hook.
 *
 * @group Behaviors
 */
export interface VirtualScrollItem {
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
 * An info about the current state of a virtualized list.
 *
 * @see {@link VirtualScrollProps.onVirtualScroll}
 * @group Behaviors
 */
export interface VirtualScrollInfo {
  /**
   * An index of the first rendered item.
   */
  renderedIndex: number;

  /**
   * A total number of rendered items.
   */
  renderedCount: number;

  /**
   * A total number of items.
   *
   * @see {@link VirtualScrollProps.totalCount}
   */
  totalCount: number;

  /**
   * An index (can be negative) of the first item.
   *
   * @see {@link VirtualScrollProps.baseIndex}
   */
  baseIndex: number;

  /**
   * A non-negative number of items that should be rendered offscreen before and after a visible range.
   *
   * @see {@link VirtualScrollProps.overscanCount}
   */
  overscanCount: number;
}

/**
 * A value returned from the {@link useVirtualScroll} hook.
 *
 * @group Behaviors
 */
export interface VirtualScrollValue {
  /**
   * An array of items to render.
   *
   * **Note:** The array and its items may be reused between re-renders.
   */
  items: readonly VirtualScrollItem[];

  /**
   * A size of all items along the scroll axis.
   *
   * `undefined` on the first render.
   */
  totalSize: number | undefined;

  /**
   * A size of items that go before {@link items} along the scroll axis.
   *
   * `undefined` on the first render.
   */
  offsetSize: number | undefined;

  /**
   * Scrolls list to an item with the given index.
   *
   * @param index An index of an item.
   */
  scrollTo(index: number): void;
}

/**
 * Props of the {@link useVirtualScroll} hook.
 *
 * @group Behaviors
 */
export interface VirtualScrollProps {
  /**
   * Returns the size of an item along the scroll axis.
   *
   * If there's a gap between items, it must be included in the returned size estimation.
   *
   * @param index An index of an item.
   */
  estimateSize: (index: number) => number;

  /**
   * A total number of items.
   */
  totalCount: number;

  /**
   * An index (can be negative) of the first item.
   *
   * @default 0
   */
  baseIndex?: number;

  /**
   * A non-negative number of items that should be rendered offscreen before and after a visible range.
   *
   * @default 0
   */
  overscanCount?: number;

  /**
   * The orientation of the scroll axis.
   *
   * @defult "vertical"
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * A reference to a scrollable container element. If omitted then the window is scrolled.
   */
  containerRef?: RefObject<Element>;

  /**
   * A padding to apply to the start of a container in pixels.
   *
   * @default 0
   */
  paddingStart?: number;

  /**
   * A padding to apply to the start of a container in pixels when scrolling to an element.
   *
   * @default 0
   */
  scrollPaddingStart?: number;

  /**
   * If `true` then the horizontal scroll events are interpreted as in an RTL environment.
   *
   * @default false
   */
  isRTL?: boolean;

  /**
   * A handler that is called when a virtualized container is being scrolled.
   *
   * @param info An info about the current state of a virtualized list. The info object is reused between handler
   * invocations.
   */
  onVirtualScroll?: (info: Readonly<VirtualScrollInfo>) => void;
}

/**
 * Virtualizes rendering of large lists.
 *
 * @example
 * const containerRef = useRef(null);
 *
 * const { items, totalSize, offsetSize } = useVirtualScroll({
 *   estimateSize: index => 200,
 *   totalCount: 100,
 *   containerRef,
 *   paddingStart: 50,
 * });
 *
 * <div
 *   ref={containerRef}
 *   style={{ height: 300, paddingTop: 50, overflow: 'auto' }}
 * >
 *   <div style={{ height: totalSize, paddingTop: offsetSize }}>
 *     {items.map(item => (
 *       <div
 *         key={item.index}
 *         ref={item.ref}
 *       >
 *         {'Hello'}
 *       </div>
 *     ))}
 *   </div>
 * </div>
 *
 * @param props Virtual scroll props.
 * @returns An object which identity never changes between renders.
 * @group Behaviors
 */
export function useVirtualScroll(props: VirtualScrollProps): VirtualScrollValue {
  const [rerenderCount, rerender] = useReducer(reduceRerenderCount, 0);
  const manager = useFunctionOnce(createVirtualScrollManager, rerender);

  manager.rerenderCount = rerenderCount;
  manager.props = props;

  useLayoutEffect(manager.onMounted);
  useLayoutEffect(manager.onRangeUpdated, [rerenderCount]);
  useLayoutEffect(manager.onItemsUpdated, [
    props.totalCount,
    props.baseIndex,
    props.orientation,
    props.containerRef,
    props.isRTL,
  ]);

  return manager.value;
}

function reduceRerenderCount(count: number): number {
  return count + 1;
}

/**
 * A typed array constructor which instances are used for storing item sizes.
 */
const BlockArrayConstructor = Float32Array;

const MAX_TYPED_ARRAY_BYTE_SIZE = 0x7fe00000;
const MAX_BROWSER_SCROLL_SIZE = 0xfffffe;

/**
 * The maximum number of blocks that are rendered simultaneously.
 */
const BLOCKS_PER_PAGE = 4;

/**
 * The maximum number of items in a single block.
 */
const MAX_BLOCK_LENGTH = MAX_TYPED_ARRAY_BYTE_SIZE / BlockArrayConstructor.BYTES_PER_ELEMENT;

/**
 * The maximum block size in pixels.
 */
const MAX_BLOCK_SIZE = MAX_BROWSER_SCROLL_SIZE / BLOCKS_PER_PAGE;

interface VirtualScrollManager {
  rerenderCount: number;
  props: VirtualScrollProps;
  value: VirtualScrollValue;
  onMounted: EffectCallback;
  onRangeUpdated: EffectCallback;
  onItemsUpdated: EffectCallback;
}

function createVirtualScrollManager(rerender: () => void): VirtualScrollManager {
  let direction = DIRECTION_TTB;

  const info: VirtualScrollInfo = {
    renderedIndex: 0,
    renderedCount: 0,
    totalCount: 0,
    baseIndex: 0,
    overscanCount: 0,
  };

  const input: CalcVirtualScrollItemsInput = {
    anchorIndex: undefined,
    items: undefined!,
    blocks: undefined!,
    blockLength: 0,
    blocksPerPage: BLOCKS_PER_PAGE,
    blockStartIndex: 0,
    totalCount: 0,
    baseIndex: 0,
    estimateSize: undefined!,
    overscanCount: 0,
    containerSize: 0,
    scrollPosition: 0,
    paddingStart: 0,
    scrollPaddingStart: 0,
  };

  const output: CalcVirtualScrollItemsOutput = {
    items: [],
    totalSize: 0,
    offsetSize: 0,
    renderedIndex: 0,
    pivotIndex: 0,
    pivotScrollPaddingStart: 0,
    blockStartIndex: 0,
    scrollPosition: undefined,
  };

  const updateScroll = (anchorIndex?: number, scrollPaddingStart = 0): void => {
    const { estimateSize, overscanCount = 0, containerRef, paddingStart = 0, onVirtualScroll } = manager.props;
    const { items, totalSize, offsetSize, scrollPosition } = output;

    const container = containerRef === undefined ? null : containerRef.current || undefined;

    if (container === undefined) {
      // No container element
      return;
    }

    input.anchorIndex = anchorIndex;
    input.estimateSize = estimateSize;
    input.overscanCount = overscanCount;
    input.containerSize = getContainerSize(direction, container);
    input.scrollPosition = getScrollPosition(direction, container);
    input.paddingStart = paddingStart;
    input.scrollPaddingStart = scrollPaddingStart;

    calcVirtualScrollItems(input, output);

    input.items = output.items;
    input.blockStartIndex = output.blockStartIndex;

    if (
      items === output.items &&
      totalSize === output.totalSize &&
      offsetSize === output.offsetSize &&
      scrollPosition === output.scrollPosition
    ) {
      return;
    }

    info.renderedIndex = output.renderedIndex;
    info.renderedCount = output.items.length;
    info.totalCount = input.totalCount;
    info.baseIndex = input.baseIndex;
    info.overscanCount = overscanCount;

    manager.value.items = output.items;
    manager.value.totalSize = output.totalSize;
    manager.value.offsetSize = output.offsetSize;

    rerender();

    onVirtualScroll?.(info);
  };

  const handleScrollTo = (index: number): void => updateScroll(index, manager.props.scrollPaddingStart);

  const handleResize: DOMEventHandler = () => updateScroll();

  const handleScroll: DOMEventHandler = event => {
    const { containerRef } = manager.props;

    if (event.target === (containerRef === undefined ? document : containerRef.current)) {
      updateScroll();
    }
  };

  const handleMounted: EffectCallback = () => {
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  };

  const handleRangeUpdated: EffectCallback = () => {
    const { containerRef, baseIndex = 0 } = manager.props;
    const { blocks, blockLength } = input;
    const { items, pivotIndex, scrollPosition } = output;

    const container = containerRef === undefined ? null : containerRef.current || undefined;

    if (manager.rerenderCount === 0 || container === undefined) {
      // Prevent item size measurements before they are rendered
      return;
    }

    let scrollShift = 0;
    let containerSizeShift = 0;

    // Calculate layout shifts after items were rendered and actual sizes are available
    for (const item of items) {
      const itemSize = getItemSize(direction, item.ref.current);
      const blockIndex = floor((item.index - baseIndex) / blockLength);
      const block = blocks[blockIndex];
      const k = item.index - baseIndex - blockIndex * blockLength;

      if (item.index < pivotIndex) {
        scrollShift += itemSize - block[k];
      } else {
        containerSizeShift += itemSize - block[k];
      }

      block[k] = itemSize;
    }

    // Scroll a container and compensate layout shifts
    if (scrollPosition !== undefined) {
      scrollTo(direction, container, scrollPosition + scrollShift);
      updateScroll();
    } else if (scrollShift !== 0) {
      scrollBy(direction, container, scrollShift);
      updateScroll();
    } else if (containerSizeShift !== 0) {
      updateScroll();
    }
  };

  const handleItemsUpdated: EffectCallback = () => {
    const { estimateSize, totalCount, baseIndex = 0, orientation, isRTL, scrollPaddingStart } = manager.props;

    direction = orientation !== 'horizontal' ? DIRECTION_TTB : isRTL ? DIRECTION_RTL : DIRECTION_LTR;

    input.items = [];
    input.blocks = [];
    input.blockLength = 0;
    input.blockStartIndex = 0;
    input.totalCount = totalCount;
    input.baseIndex = baseIndex;

    if (totalCount === 0) {
      updateScroll();
      return;
    }

    // Estimate the maximum block length and populate the first block
    const block = [];

    let blockSize = 0;

    for (let i = baseIndex; block.length < totalCount && block.length < MAX_BLOCK_LENGTH; ++i) {
      const itemSize = estimateSize(i);

      blockSize += itemSize;

      if (blockSize > MAX_BLOCK_SIZE) {
        break;
      }
      block.push(itemSize);
    }

    input.blockLength = floor(blockSize / block.length);
    input.blocks[0] = new BlockArrayConstructor(block);

    const { pivotIndex, pivotScrollPaddingStart } = output;

    // Pivot item position must remain intact after items are added or removed
    updateScroll(
      pivotIndex,
      pivotIndex < baseIndex || pivotIndex > baseIndex + totalCount ? scrollPaddingStart : pivotScrollPaddingStart
    );
  };

  const manager: VirtualScrollManager = {
    rerenderCount: 0,
    props: undefined!,
    value: {
      items: [],
      totalSize: undefined,
      offsetSize: undefined,
      scrollTo: handleScrollTo,
    },
    onMounted: handleMounted,
    onRangeUpdated: handleRangeUpdated,
    onItemsUpdated: handleItemsUpdated,
  };

  return manager;
}

const DIRECTION_TTB = 0;
const DIRECTION_LTR = 1;
const DIRECTION_RTL = -1;

function getItemSize(direction: number, element: Element | null): number {
  if (element === null) {
    return 0;
  } else {
    return direction === DIRECTION_TTB ? element.getBoundingClientRect().height : element.getBoundingClientRect().width;
  }
}

function getContainerSize(direction: number, container: Element | null): number {
  if (container === null) {
    return direction === DIRECTION_TTB ? window.innerHeight : window.innerWidth;
  } else {
    return direction === DIRECTION_TTB ? container.clientHeight : container.clientWidth;
  }
}

function getScrollPosition(direction: number, container: Element | null): number {
  if (container === null) {
    return direction === DIRECTION_TTB ? window.scrollY : direction * window.scrollX;
  } else {
    return direction === DIRECTION_TTB ? container.scrollTop : direction * container.scrollLeft;
  }
}

function scrollBy(direction: number, container: Element | null, offset: number): void {
  const target = container || window;

  if (direction === DIRECTION_TTB) {
    target.scrollBy(0, offset);
  } else {
    target.scrollBy(direction * offset, 0);
  }
}

function scrollTo(direction: number, container: Element | null, position: number): void {
  scrollBy(direction, container, position - getScrollPosition(direction, container));
}

const { min, max, floor, ceil } = Math;

export interface CalcVirtualScrollItemsInput {
  anchorIndex: number | undefined;
  items: readonly VirtualScrollItem[];
  blocks: InstanceType<typeof BlockArrayConstructor>[];
  blockLength: number;
  blocksPerPage: number;
  blockStartIndex: number;
  totalCount: number;
  baseIndex: number;
  estimateSize: (index: number) => number;
  overscanCount: number;
  containerSize: number;
  scrollPosition: number;
  paddingStart: number;
  scrollPaddingStart: number;
}

export interface CalcVirtualScrollItemsOutput {
  items: readonly VirtualScrollItem[];
  totalSize: number;
  offsetSize: number;
  renderedIndex: number;
  pivotIndex: number;
  pivotScrollPaddingStart: number;
  blockStartIndex: number;
  scrollPosition: number | undefined;
}

/**
 * Recalculates items array depending on container scroll state.
 *
 * Terminology:
 *
 * <dl>
 * <dt>Block</dt>
 * <dd>A fixed-size array of items.</dd>
 *
 * <dt>Page</dt>
 * <dd>
 * A fixed-size group of blocks. Consecutive pages share adjacent bocks: the last block of the first page is the first
 * block of the second page. When scroll reaches first (or last block) of a page, then a scroll position is moved to
 * the start of the last block of the previous page (or to the start of the first block of the next page).
 * </dd>
 *
 * <dt>Pivot item</dt>
 * <dd>An item which scroll position must be preserved if item sizes are adjusted after rendering.</dd>
 *
 * <dt>Anchor item</dt>
 * <dd>An item to which a container must be scrolled.</dd>
 * </dl>
 */
export function calcVirtualScrollItems(input: CalcVirtualScrollItemsInput, output: CalcVirtualScrollItemsOutput): void {
  const {
    anchorIndex,
    items,
    blocks,
    blockLength,
    blocksPerPage,
    blockStartIndex,
    totalCount,
    baseIndex,
    estimateSize,
    overscanCount,
    containerSize,
    scrollPosition,
    paddingStart,
    scrollPaddingStart,
  } = input;

  if (totalCount === 0) {
    output.items = items.length === 0 ? items : [];
    output.renderedIndex = output.pivotIndex = baseIndex;
    output.offsetSize = output.totalSize = output.pivotScrollPaddingStart = output.blockStartIndex = 0;
    output.scrollPosition = undefined;
    return;
  }

  const blockCount = ceil(totalCount / blockLength);
  const blockEndIndex = min(blockStartIndex + blocksPerPage, blockCount);

  let totalSize = 0;
  let offscreenSize = 0;
  let offscreenCount = 0;
  let pivotOffscreenSize = 0;
  let pivotOffscreenCount = 0;
  let visibleCount = 0;

  // Pixel thresholds for swapping blocks when scroll position crosses them
  let prevBlockThreshold = 0;
  let nextBlockThreshold = 0;

  // Compute visible items and required offsets
  for (let blockIndex = blockStartIndex; blockIndex < blockEndIndex; ++blockIndex) {
    let block = blocks[blockIndex];

    if (block === undefined) {
      // Populate an absent block
      block = blocks[blockIndex] = new BlockArrayConstructor(blockLength);

      for (let k = 0, i = blockIndex * blockLength; k < blockLength && i < totalCount; ++k, ++i) {
        block[k] = estimateSize(baseIndex + i);
      }
    }

    for (let k = 0, i = blockIndex * blockLength; k < blockLength && i < totalCount; ++k, ++i) {
      const itemSize = block[k];

      if (paddingStart + totalSize + itemSize <= scrollPosition) {
        // Ends before a visible range
        pivotOffscreenSize = offscreenSize = totalSize += itemSize;
        pivotOffscreenCount = ++offscreenCount;
        continue;
      }

      if (paddingStart + totalSize >= scrollPosition + containerSize) {
        // Starts after a visible range
        totalSize += itemSize;
        continue;
      }

      if (
        paddingStart + totalSize < scrollPosition &&
        paddingStart + totalSize + itemSize < scrollPosition + containerSize
      ) {
        // Start before a visible range and ends before a visible range ends
        pivotOffscreenSize += itemSize;
        pivotOffscreenCount++;
      }

      totalSize += itemSize;
      visibleCount++;
    }

    if (blockIndex === blockStartIndex) {
      prevBlockThreshold = totalSize;
    }
    if (blockIndex < blockEndIndex - 1) {
      nextBlockThreshold = totalSize;
    }
  }

  const isAnchored = anchorIndex !== undefined;

  let nextBlockStartIndex;

  if (isAnchored) {
    nextBlockStartIndex = floor(min(anchorIndex - baseIndex, totalCount - 1) / blockLength) - 1;
    nextBlockStartIndex -= nextBlockStartIndex % (blocksPerPage - 2);
  } else if (scrollPosition < prevBlockThreshold) {
    nextBlockStartIndex = blockStartIndex - (blocksPerPage - 2);
  } else if (scrollPosition > nextBlockThreshold) {
    nextBlockStartIndex = blockStartIndex + (blocksPerPage - 2);
  } else {
    nextBlockStartIndex = blockStartIndex;
  }

  nextBlockStartIndex = max(0, min(nextBlockStartIndex, blockCount - blocksPerPage));

  const nextBlockEndIndex = min(nextBlockStartIndex + blocksPerPage, blockCount);

  const isBlockChanged = blockStartIndex !== nextBlockStartIndex || blockEndIndex !== nextBlockEndIndex;

  const nextBlockOffset = nextBlockStartIndex * blockLength;

  let offsetSize = offscreenSize;
  let offsetCount = offscreenCount;

  let nextRenderedCount = visibleCount;
  let nextScrollPosition: number | undefined;

  if (isAnchored || isBlockChanged || overscanCount !== 0) {
    // Block changes and overscan cannot be accounted for on the first pass

    if (isAnchored) {
      pivotOffscreenSize = scrollPosition;
      pivotOffscreenCount = offscreenCount = min(anchorIndex - baseIndex, totalCount - 1) - nextBlockOffset;
    } else if (isBlockChanged) {
      pivotOffscreenSize = scrollPosition;
      pivotOffscreenCount = offscreenCount =
        blockStartIndex < nextBlockStartIndex ? blockLength : (blocksPerPage - 1) * blockLength;
    }

    offsetCount = max(0, offscreenCount - overscanCount);

    nextRenderedCount =
      min(
        nextBlockOffset + offsetCount + visibleCount + 2 * overscanCount + min(0, offscreenCount - overscanCount),
        nextBlockOffset + blockLength * blocksPerPage,
        totalCount
      ) -
      nextBlockOffset -
      offsetCount;

    offsetSize = 0;
    totalSize = 0;

    for (
      let blockIndex = nextBlockStartIndex, p = offsetCount, q = offscreenCount;
      blockIndex < nextBlockEndIndex;
      ++blockIndex
    ) {
      let block = blocks[blockIndex];

      if (block === undefined) {
        // Populate an absent block
        block = blocks[blockIndex] = new BlockArrayConstructor(blockLength);

        for (let k = 0, i = blockIndex * blockLength; k < blockLength && i < totalCount; ++k, ++i) {
          block[k] = estimateSize(baseIndex + i);
        }
      }

      for (let k = 0, i = blockIndex * blockLength; k < blockLength && i < totalCount; ++k, ++i) {
        totalSize += block[k];

        if (p-- > 0) {
          offsetSize = totalSize;
        }
        if ((isAnchored || isBlockChanged) && q-- > 0) {
          nextScrollPosition = totalSize;
        }
      }
    }

    if (nextScrollPosition !== undefined) {
      if (isAnchored) {
        nextScrollPosition -= scrollPaddingStart;
        pivotOffscreenSize += scrollPaddingStart;
      } else if (isBlockChanged) {
        // Prevent loosing scroll pixels when blocks are swapped

        const scrollDelta =
          scrollPosition - (blockStartIndex < nextBlockStartIndex ? nextBlockThreshold : prevBlockThreshold);

        nextScrollPosition += scrollDelta;
        pivotOffscreenSize -= scrollDelta;
      }
    }
  }

  const renderedCount = items.length;
  const renderedIndex = renderedCount === 0 ? baseIndex : items[0].index;

  const nextRenderedIndex = baseIndex + nextBlockOffset + offsetCount;

  if (renderedIndex !== nextRenderedIndex || renderedCount !== nextRenderedCount) {
    // Rendered items have changed
    const nextItems: VirtualScrollItem[] = [];

    for (let i = 0, j = nextRenderedIndex - renderedIndex; i < nextRenderedCount; ++i, ++j) {
      // Reuse ref objects
      if (j > -1 && j < renderedCount) {
        nextItems.push(items[j]);
        continue;
      }

      nextItems.push({
        index: nextRenderedIndex + i,
        ref: { current: null },
      });
    }

    output.items = nextItems;
  } else {
    output.items = items;
  }

  output.offsetSize = offsetSize;
  output.totalSize = totalSize;
  output.renderedIndex = nextRenderedIndex;
  output.pivotIndex = baseIndex + nextBlockOffset + pivotOffscreenCount;
  output.pivotScrollPaddingStart = pivotOffscreenSize - scrollPosition;
  output.blockStartIndex = nextBlockStartIndex;
  output.scrollPosition = nextScrollPosition;
}
