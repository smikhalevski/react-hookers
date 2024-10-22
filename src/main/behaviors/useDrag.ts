import { EffectCallback, RefObject, useLayoutEffect, useState } from 'react';
import { DOMEventHandler } from '../types';
import { useFunction } from '../useFunction';
import { emptyArray, noop } from '../utils/lang';

/**
 * A value returned from the {@link useDrag} hook.
 *
 * @group Behaviors
 */
export interface DragValue {
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
   * Pointer X coordinate relative to window top-left corner. Doesn't include the scroll position.
   */
  clientX: number;

  /**
   * Pointer Y coordinate relative to window top-left corner. Doesn't include the scroll position.
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
 * @param ref A ref to a draggable element.
 * @param props Drag props.
 * @returns An object which identity never changes between renders.
 * @group Behaviors
 */
export function useDrag(ref: RefObject<HTMLElement>, props: DragProps): DragValue {
  const [isDragged, setDragged] = useState(false);

  const manager = useFunction(createDragManager, setDragged);

  manager.ref = ref;
  manager.props = props;
  manager.value.isDragged = isDragged;

  useLayoutEffect(manager.onMount, emptyArray);
  useLayoutEffect(manager.onUpdate);

  return manager.value;
}

interface DragManager {
  ref: RefObject<HTMLElement>;
  props: DragProps;
  value: DragValue;
  onMount: EffectCallback;
  onUpdate: EffectCallback;
}

function createDragManager(setDragged: (isDragged: boolean) => void): DragManager {
  let isDragged = false;
  let unsubscribeEventListeners = noop;
  let cancel = noop;

  const handleMount: EffectCallback = () => {
    document.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('mousedown', handleDragStart);

    return () => {
      document.removeEventListener('touchstart', handleDragStart);
      document.removeEventListener('mousedown', handleDragStart);

      unsubscribeEventListeners();
    };
  };

  const handleUpdate: EffectCallback = () => {
    if (manager.props.isDisabled) {
      cancel();
    }
  };

  const handleDragStart: DOMEventHandler<MouseEvent | TouchEvent> = event => {
    const { isDisabled, onDragStart, onDragChange } = manager.props;
    const target = manager.ref.current;

    if (isDisabled || isDragged || event.defaultPrevented || target === null || !target.contains(event.target)) {
      return;
    }

    event.preventDefault();

    const targetRect = target.getBoundingClientRect();

    const pointerOffsetY = getClientY(event) - targetRect.top;
    const pointerOffsetX = getClientX(event) - targetRect.left;

    const dragInfo: DragInfo = {
      clientX: getClientX(event) - pointerOffsetX,
      clientY: getClientY(event) - pointerOffsetY,
      pointerOffsetX,
      pointerOffsetY,
      target,
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
    ref: undefined!,
    props: undefined!,
    value: {
      isDragged: false,
      cancelDrag: () => cancel(),
    },
    onMount: handleMount,
    onUpdate: handleUpdate,
  };

  return manager;
}

function getClientX(event: MouseEvent | TouchEvent): number {
  return 'touches' in event ? event.touches[0].clientX : event.clientX;
}

function getClientY(event: MouseEvent | TouchEvent): number {
  return 'touches' in event ? event.touches[0].clientY : event.clientY;
}
