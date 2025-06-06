import { DOMAttributes } from 'react';
import { DragInfo, DragProps, useDrag } from '../behaviors/useDrag.js';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { noop } from '../utils/lang.js';

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
 * @param props Track handle props.
 * @returns An object which identity never changes between renders.
 * @group Components
 */
export function useTrackHandle(props: HeadlessTrackHandleProps): HeadlessTrackHandleValue {
  const manager = useFunctionOnce(createTrackHandleManager);

  manager.props = props;
  manager.dragProps.isDisabled = props.isDisabled;
  manager.dragProps.onDragStart = props.onDragStart;
  manager.dragProps.onDragEnd = props.onDragEnd;
  manager.dragProps.onDragChange = props.onDragChange;

  const dragValue = useDrag(manager.dragProps);

  manager.value.handleProps = dragValue.dragProps;
  manager.value.isDragged = dragValue.isDragged;
  manager.value.cancelDrag = manager.cancelDrag = dragValue.cancelDrag;

  return manager.value;
}

const { min, max } = Math;

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

    const right = max(left, trackRect.right - handleMargin);
    const bottom = max(top, trackRect.bottom - handleMargin);

    const percentage =
      orientation === 'vertical'
        ? (min(bottom, max(info.y, top)) - top) / (bottom - top - info.targetRect.height)
        : (min(right, max(info.x, left)) - left) / (right - left - info.targetRect.width);

    onDrag?.(info);
    onPercentageChange?.(percentage);
  };

  const manager: TrackHandleManager = {
    dragProps: {
      onDrag: handleDrag,
    },
    props: undefined!,
    value: {
      handleProps: undefined!,
      isDragged: false,
      cancelDrag: noop,
    },
    cancelDrag: noop,
  };

  return manager;
}
