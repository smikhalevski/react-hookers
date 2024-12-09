import { DOMAttributes, RefObject } from 'react';
import { DragInfo, DragProps, useDrag } from '../behaviors/useDrag';
import { useFunctionOnce } from '../useFunctionOnce';
import { noop } from '../utils/lang';

/**
 * A value returned from the {@link useTrackHandle} hook.
 *
 * @group Components
 */
export interface HeadlessTrackHandleValue {
  /**
   * Props of a handle element.
   *
   * An object which identity never changes between renders.
   */
  handleProps: DOMAttributes<Element>;

  /**
   * `true` if a handle is currently being dragged.
   */
  isDragged: boolean;

  /**
   * Cancels the current drag interaction.
   */
  cancelDrag: () => void;
}

/**
 * Props of the {@link useTrackHandle} hook.
 *
 * @group Components
 */
export interface HeadlessTrackHandleProps extends DragProps {
  /**
   * Returns a bounding rect of a track.
   */
  getTrackRect: () => DOMRect | undefined;

  /**
   * Minimum distance between {@link getTrackRect track bounds} and handle bounds in the {@link orientation} direction.
   *
   * @default 0
   */
  handleMargin?: number;

  /**
   * The orientations of a track along which a handle is dragged.
   *
   * @default "horizontal"
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * A handler that is called when the handle is dragged along the track.
   *
   * @param percentage A percentage at which a track is positioned.
   */
  onPercentageChange?: (percentage: number) => void;
}

/**
 * A handle that can be dragged along the track.
 *
 * @param ref A reference to a handle element.
 * @param props Track handle props.
 * @returns An object which identity never changes between renders.
 * @group Components
 */
export function useTrackHandle(ref: RefObject<HTMLElement>, props: HeadlessTrackHandleProps): HeadlessTrackHandleValue {
  const manager = useFunctionOnce(createTrackHandleManager);

  manager.props = props;
  manager.dragProps.isDisabled = props.isDisabled;
  manager.dragProps.onDragStart = props.onDragStart;
  manager.dragProps.onDragEnd = props.onDragEnd;
  manager.dragProps.onDragChange = props.onDragChange;

  const dragValue = useDrag(ref, manager.dragProps);

  manager.value.isDragged = dragValue.isDragged;
  manager.value.cancelDrag = manager.cancelDrag = dragValue.cancelDrag;

  return manager.value;
}

interface TrackHandleManager {
  dragProps: DragProps;
  props: HeadlessTrackHandleProps;
  value: HeadlessTrackHandleValue;
  cancelDrag: () => void;
}

function createTrackHandleManager(): TrackHandleManager {
  const handleDrag = (info: DragInfo) => {
    const { getTrackRect, handleMargin = 0, orientation, onPercentageChange, onDrag } = manager.props;

    const trackRect = getTrackRect();

    if (trackRect === undefined) {
      manager.cancelDrag();
      return;
    }

    const top = trackRect.top + handleMargin;
    const left = trackRect.left + handleMargin;

    const right = Math.max(left, trackRect.right - handleMargin);
    const bottom = Math.max(top, trackRect.bottom - handleMargin);

    onDrag?.(info);

    onPercentageChange?.(
      orientation === 'vertical'
        ? (Math.min(bottom, Math.max(info.clientY, top)) - top) / (bottom - top - info.targetRect.height)
        : (Math.min(right, Math.max(info.clientX, left)) - left) / (right - left - info.targetRect.width)
    );
  };

  const manager: TrackHandleManager = {
    dragProps: {
      onDrag: handleDrag,
    },
    props: undefined!,
    value: {
      handleProps: {},
      isDragged: false,
      cancelDrag: noop,
    },
    cancelDrag: noop,
  };

  return manager;
}
