import React, { type DOMAttributes, EffectCallback, useLayoutEffect, useState } from 'react';
import { DOMEventHandler } from '../types.js';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { emptyArray, noop } from '../utils/lang.js';

/**
 * A value returned from the {@link useDrag} hook.
 *
 * @group Behaviors
 */
export interface DragValue {
  /**
   * Props for the element for which drag interactions are tracked.
   *
   * An object whose identity never changes between renders.
   */
  dragProps: DOMAttributes<Element>;

  /**
   * `true` if the element is currently being dragged.
   */
  isDragged: boolean;

  /**
   * Cancels the current drag interaction.
   */
  cancelDrag: () => void;
}

/**
 * Info about the current drag frame.
 *
 * @see {@link DragProps.onDrag}
 * @group Behaviors
 */
export interface DragInfo {
  /**
   * The X coordinate of the dragged element's bounding rect, captured when the drag started.
   *
   * Does not include scroll position.
   */
  startX: number;

  /**
   * The Y coordinate of the dragged element's bounding rect, captured when the drag started.
   *
   * Does not include scroll position.
   */
  startY: number;

  /**
   * The current X coordinate of the dragged element's bounding rect.
   *
   * Does not include scroll position.
   */
  x: number;

  /**
   * The current Y coordinate of the dragged element's bounding rect.
   *
   * Does not include scroll position.
   */
  y: number;

  /**
   * The distance between the element's X coordinate and the pointer X position, captured when the drag started.
   */
  offsetX: number;

  /**
   * The distance between the element's Y coordinate and the pointer Y position, captured when the drag started.
   */
  offsetY: number;

  /**
   * The dragged element.
   */
  target: Element;

  /**
   * The {@link target} bounding rect captured on drag start.
   */
  targetRect: DOMRect;
}

/**
 * Props for the {@link useDrag} hook.
 *
 * @group Behaviors
 */
export interface DragProps {
  /**
   * If `true`, drag listeners are disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * A handler that is called when the user starts dragging the element.
   *
   * @param info Info about the current drag frame.
   */
  onDragStart?: (info: DragInfo) => void;

  /**
   * A handler that is called when the user stops dragging the element.
   *
   * @param info Info about the current drag frame.
   */
  onDragEnd?: (info: DragInfo) => void;

  /**
   * A handler that is called while the user is actively dragging the element.
   *
   * @param info Info about the current drag frame.
   */
  onDrag?: (info: DragInfo) => void;

  /**
   * A handler that is called when the drag state changes.
   *
   * @param isDragged `true` if the element is being dragged.
   */
  onDragChange?: (isDragged: boolean) => void;
}

/**
 * Handles drag interactions across platforms.
 *
 * @example
 * const targetRef = useRef(null);
 *
 * const { dragProps, isDragged } = useDrag({
 *   onDrag(info) {
 *     targetRef.current.style.inset = `${info.y}px auto auto ${info.x}px`;
 *   },
 * });
 *
 * <div
 *   {...dragProps}
 *   ref={targetRef}
 *   style={{
 *     position: 'absolute',
 *     width: 100,
 *     height: 100,
 *     backgroundColor: isDragged ? 'red' : 'blue',
 *   }}
 * />
 *
 * @param props Drag props.
 * @returns An object whose identity never changes between renders.
 * @group Behaviors
 */
export function useDrag(props: DragProps): DragValue {
  const [isDragged, setDragged] = useState(false);

  const manager = useFunctionOnce(createDragManager, setDragged);

  manager.props = props;
  manager.value.isDragged = isDragged;

  useLayoutEffect(manager.onMounted, emptyArray);
  useLayoutEffect(manager.onUpdated);

  return manager.value;
}

interface DragManager {
  props: DragProps;
  value: DragValue;
  onMounted: EffectCallback;
  onUpdated: EffectCallback;
}

function createDragManager(setDragged: (isDragged: boolean) => void): DragManager {
  let isDragged = false;
  let unsubscribeEventListeners = noop;
  let cancel = noop;

  const handleMounted: EffectCallback = () => () => unsubscribeEventListeners();

  const handleUpdated: EffectCallback = () => {
    if (manager.props.isDisabled) {
      cancel();
    }
  };

  const handleDragStart = (event: React.TouchEvent | React.MouseEvent): void => {
    const { isDisabled, onDragStart, onDragChange } = manager.props;

    if (isDisabled || isDragged || event.defaultPrevented) {
      return;
    }

    event.preventDefault();

    const targetRect = event.currentTarget.getBoundingClientRect();

    const startX = targetRect.left;
    const startY = targetRect.top;
    const offsetX = getClientX(event) - startX;
    const offsetY = getClientY(event) - startY;

    const dragInfo: DragInfo = {
      startX,
      startY,
      x: startX,
      y: startY,
      offsetX,
      offsetY,
      target: event.currentTarget,
      targetRect,
    };

    cancel = () => {
      const { onDragChange, onDragEnd } = manager.props;

      unsubscribeEventListeners();
      cancel = noop;

      isDragged = false;
      setDragged(isDragged);

      onDragChange?.(isDragged);
      onDragEnd?.(dragInfo);
    };

    const handleDrag: DOMEventHandler<MouseEvent | TouchEvent> = event => {
      const { onDrag } = manager.props;

      event.preventDefault();

      dragInfo.x = getClientX(event) - offsetX;
      dragInfo.y = getClientY(event) - offsetY;

      onDrag?.(dragInfo);
    };

    const handleTouchStart: DOMEventHandler<TouchEvent> = event => {
      if (event.touches.length !== 1) {
        cancel();
      }
    };

    if (event.type === 'touchstart') {
      document.addEventListener('touchstart', handleTouchStart, true);
      document.addEventListener('touchmove', handleDrag, { passive: false });
      document.addEventListener('touchend', cancel, true);
    } else {
      document.addEventListener('mousemove', handleDrag, true);
      document.addEventListener('mouseup', cancel, true);
    }

    window.addEventListener('blur', cancel);

    unsubscribeEventListeners = () => {
      unsubscribeEventListeners = noop;

      document.removeEventListener('touchstart', handleTouchStart, true);
      document.removeEventListener('touchmove', handleDrag);
      document.removeEventListener('touchend', cancel, true);
      document.removeEventListener('mousemove', handleDrag, true);
      document.removeEventListener('mouseup', cancel, true);
      window.removeEventListener('blur', cancel);
    };

    isDragged = true;
    setDragged(isDragged);

    onDragStart?.(dragInfo);
    onDragChange?.(isDragged);
  };

  const manager: DragManager = {
    props: undefined!,
    value: {
      dragProps: {
        onTouchStart: handleDragStart,
        onMouseDown: handleDragStart,
      },
      isDragged: false,
      cancelDrag: () => cancel(),
    },
    onMounted: handleMounted,
    onUpdated: handleUpdated,
  };

  return manager;
}

function getClientX(event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): number {
  return 'touches' in event ? event.touches[0].clientX : event.clientX;
}

function getClientY(event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): number {
  return 'touches' in event ? event.touches[0].clientY : event.clientY;
}
