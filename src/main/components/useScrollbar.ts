import { DOMAttributes, EffectCallback, RefObject, useLayoutEffect, useState } from 'react';
import { DOMEventHandler } from '../types';
import { useFunctionOnce } from '../useFunctionOnce';
import { emptyArray, noop } from '../utils/lang';
import { HeadlessTrackHandleProps, useTrackHandle } from './useTrackHandle';

/**
 * An info about the current state of a scrollbar.
 *
 * @see {@link HeadlessScrollbarProps.onScroll}
 * @group Components
 */
export interface ScrollbarInfo {
  /**
   * A scroll percentage of a container, determines a position of a scrollbar handle.
   *
   * Percentage can be less than 0 and greater than 1 during an overscroll.
   */
  percentage: number;

  /**
   * A container bounding rect size divided by a container scroll size, determines the size of a scrollbar handle,
   * so it reflects the amount of visible content.
   */
  ratio: number;
}

/**
 * A value returned from the {@link useScrollbar} hook.
 *
 * @group Components
 */
export interface HeadlessScrollbarValue {
  /**
   * Props of an element that must have a scroll handle behaviour.
   *
   * An object which identity never changes between renders.
   */
  handleProps: DOMAttributes<Element>;

  /**
   * `true` if container is scrollable, and scrollbar has something to scroll.
   */
  isScrollable: boolean;

  /**
   * `true` if the scrollbar handle drag has started, or if a container is being scrolled. Scrollbar stays active for
   * {@link HeadlessScrollbarProps.deactivateDelay deactivateDelay} after becoming idle.
   */
  isActive: boolean;

  /**
   * `true` if a scroll handle is currently being dragged.
   */
  isDragged: boolean;
}

/**
 * Props of the {@link useScrollbar} hook.
 *
 * @group Components
 */
export interface HeadlessScrollbarProps {
  /**
   * A reference to a scrollable container element.
   */
  containerRef: RefObject<Element>;

  /**
   * A reference to a scrollbar track element.
   */
  trackRef: RefObject<Element>;

  /**
   * A reference to a scrollbar handle element.
   */
  handleRef: RefObject<HTMLElement>;

  /**
   * Minimum distance between {@link trackRef a scrollbar track} bounds and {@link handleRef a scrollbar handle} in
   * the direction of scrollbar {@link orientation}.
   *
   * @default 0
   */
  handleMargin?: number;

  /**
   * The orientations of a scrollbar track along which a scrollbar handle can be dragged.
   *
   * @default "vertical"
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * A delay after which scrollbar is {@link HeadlessScrollbarValue.isActive deactivated}.
   *
   * @default 3000
   */
  deactivateDelay?: number;

  /**
   * A handler that is called when a {@link containerRef container} is being scrolled.
   *
   * @param info An info about the current state of a scrollbar. The info object is reused between handler invocations.
   */
  onScroll?: (info: Readonly<ScrollbarInfo>) => void;
}

/**
 * Provides the behavior and accessibility implementation for a scrollbar component.
 *
 * @param props Scrollbar props.
 * @returns An object which identity never changes between renders.
 * @group Components
 */
export function useScrollbar(props: HeadlessScrollbarProps): HeadlessScrollbarValue {
  const [status, setStatus] = useState(STATUS_NOT_SCROLLABLE);

  const manager = useFunctionOnce(createScrollbarManager, setStatus);

  manager.props = props;
  manager.trackHandleProps.handleMargin = props.handleMargin;
  manager.trackHandleProps.orientation = props.orientation === 'horizontal' ? 'horizontal' : 'vertical';

  const trackHandleValue = useTrackHandle(props.handleRef, manager.trackHandleProps);

  manager.cancelDrag = trackHandleValue.cancelDrag;
  manager.value.handleProps = trackHandleValue.handleProps;
  manager.value.isScrollable = status !== STATUS_NOT_SCROLLABLE;
  manager.value.isActive = status === STATUS_ACTIVE || status === STATUS_DRAGGED;
  manager.value.isDragged = status === STATUS_DRAGGED;

  useLayoutEffect(manager.onMounted, emptyArray);

  return manager.value;
}

const STATUS_NOT_SCROLLABLE = 0;
const STATUS_SCROLLABLE = 1;
const STATUS_ACTIVE = 2;
const STATUS_DRAGGED = 3;

const REPOSITION_DELAY = 300;
const DEACTIVATE_DELAY = 3000;

interface ScrollbarManager {
  trackHandleProps: HeadlessTrackHandleProps;
  props: HeadlessScrollbarProps;
  value: HeadlessScrollbarValue;
  cancelDrag: () => void;
  onMounted: EffectCallback;
}

function createScrollbarManager(setStatus: (status: number) => void): ScrollbarManager {
  let status = STATUS_NOT_SCROLLABLE;
  let percentage = -1;
  let repositionTimer: NodeJS.Timeout;
  let deactivateTimer: NodeJS.Timeout;

  const info: ScrollbarInfo = {
    percentage: 0,
    ratio: 0,
  };

  const getTrackRect = (): DOMRect | undefined => manager.props.trackRef.current?.getBoundingClientRect();

  const deactivate = (): void => {
    if (status === STATUS_NOT_SCROLLABLE) {
      return;
    }
    status = STATUS_SCROLLABLE;
    setStatus(status);
  };

  const reposition = (): void => {
    clearTimeout(repositionTimer);
    repositionTimer = setTimeout(reposition, REPOSITION_DELAY);

    const { orientation, containerRef, onScroll } = manager.props;
    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = containerRef.current!;

    if (orientation === 'horizontal' ? scrollWidth === clientWidth : scrollHeight === clientHeight) {
      status = STATUS_NOT_SCROLLABLE;
      setStatus(status);
      clearTimeout(deactivateTimer);
      manager.cancelDrag();
      return;
    }

    if (status === STATUS_NOT_SCROLLABLE) {
      status = STATUS_SCROLLABLE;
      setStatus(status);
    }

    if (
      onScroll === undefined ||
      percentage ===
        (percentage =
          orientation === 'horizontal'
            ? scrollLeft / (scrollWidth - clientWidth)
            : scrollTop / (scrollHeight - clientHeight))
    ) {
      return;
    }

    info.percentage = percentage;
    info.ratio = orientation === 'horizontal' ? clientWidth / scrollWidth : clientHeight / scrollHeight;

    onScroll(info);
  };

  const handleMounted: EffectCallback = () => {
    reposition();

    document.addEventListener('scroll', handleContainerScroll, true);

    return () => {
      clearTimeout(repositionTimer);
      clearTimeout(deactivateTimer);

      document.removeEventListener('scroll', handleContainerScroll, true);
    };
  };

  const handleContainerScroll: DOMEventHandler = event => {
    const { containerRef, deactivateDelay = DEACTIVATE_DELAY } = manager.props;

    if (event.target !== containerRef.current) {
      return;
    }

    if (status !== STATUS_DRAGGED) {
      status = STATUS_ACTIVE;
      setStatus(status);

      clearTimeout(deactivateTimer);
      deactivateTimer = setTimeout(deactivate, deactivateDelay);
    }

    reposition();
  };

  const handleScrollbarScroll = (scrollPercentage: number) => {
    const container = manager.props.containerRef.current!;

    if (manager.props.orientation === 'horizontal') {
      container.scrollLeft = (container.scrollWidth - container.clientWidth) * scrollPercentage;
    } else {
      container.scrollTop = (container.scrollHeight - container.clientHeight) * scrollPercentage;
    }
  };

  const handleScrollbarDragChange = (isDragging: boolean) => {
    const { deactivateDelay = DEACTIVATE_DELAY } = manager.props;

    if (status === STATUS_NOT_SCROLLABLE) {
      return;
    }

    clearTimeout(deactivateTimer);

    if (isDragging) {
      status = STATUS_DRAGGED;
      setStatus(status);
      return;
    }

    status = STATUS_ACTIVE;
    setStatus(status);
    deactivateTimer = setTimeout(deactivate, deactivateDelay);
  };

  const manager: ScrollbarManager = {
    trackHandleProps: {
      getTrackRect,
      onPercentageChange: handleScrollbarScroll,
      onDragChange: handleScrollbarDragChange,
    },
    props: undefined!,
    value: {
      handleProps: undefined!,
      isScrollable: false,
      isActive: false,
      isDragged: false,
    },
    cancelDrag: noop,
    onMounted: handleMounted,
  };

  return manager;
}
