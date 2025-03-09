import React, { type DOMAttributes, EffectCallback, useLayoutEffect, useState } from 'react';
import { DOMEventHandler } from '../types';
import { useFunctionOnce } from '../useFunctionOnce';
import { emptyArray, noop } from '../utils/lang';

/**
 * A value returned from the {@link useDrag} hook.
 *
 * @group Behaviors
 */
export interface DragValue {
  /**
   * Props of an element for which drag is tracked.
   *
   * An object which identity never changes between renders.
   */
  dragProps: DOMAttributes<Element>;

  /**
   * `true` if an element is currently being dragged.
   */
  isDragged: boolean;

  /**
   * Cancels the current drag interaction.
   */
  cancelDrag: () => void;
}

/**
 * An info about the current drag frame.
 *
 * @see {@link DragProps.onDrag}
 * @group Behaviors
 */
export interface DragInfo {
  /**
   * Pointer X coordinate relative to window top-left corner where the drag has started.
   *
   * Doesn't include the scroll position.
   */
  originX: number;

  /**
   * Pointer Y coordinate relative to window top-left corner where the drag has started.
   *
   * Doesn't include the scroll position.
   */
  originY: number;

  /**
   * Pointer X coordinate relative to window top-left corner.
   *
   * Doesn't include the scroll position.
   */
  clientX: number;

  /**
   * Pointer Y coordinate relative to window top-left corner.
   *
   * Doesn't include the scroll position.
   */
  clientY: number;

  /**
   * Pointer X offset relative to the top-left corner of the dragged element.
   */
  pointerOffsetX: number;

  /**
   * Pointer Y offset relative to the top-left corner of the dragged element.
   */
  pointerOffsetY: number;

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
 * Props of the {@link useDrag} hook.
 *
 * @group Behaviors
 */
export interface DragProps {
  /**
   * If `true` drag listeners are disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * A handler that is called when a user starts to drag an element.
   *
   * @param info An info about the current drag frame.
   */
  onDragStart?: (info: DragInfo) => void;

  /**
   * A handler that is called when a user stops dragging an element.
   *
   * @param info An info about the current drag frame.
   */
  onDragEnd?: (info: DragInfo) => void;

  /**
   * A handler that is called when a user is actively dragging an element.
   *
   * @param info An info about the current drag frame.
   */
  onDrag?: (info: DragInfo) => void;

  /**
   * A handler that is called when the drag state changes.
   *
   * @param isDragged `true` if an element is dragged.
   */
  onDragChange?: (isDragged: boolean) => void;
}

/**
 * Handles the drag behaviour across platforms.
 *
 * @param props Drag props.
 * @returns An object which identity never changes between renders.
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

    const originX = getClientX(event);
    const originY = getClientY(event);
    const pointerOffsetX = originX - targetRect.left;
    const pointerOffsetY = originY - targetRect.top;

    const dragInfo: DragInfo = {
      originX,
      originY,
      clientX: originX - pointerOffsetX,
      clientY: originY - pointerOffsetY,
      pointerOffsetX,
      pointerOffsetY,
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

      dragInfo.clientX = getClientX(event) - pointerOffsetX;
      dragInfo.clientY = getClientY(event) - pointerOffsetY;

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
