import { EffectCallback, useLayoutEffect } from 'react';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { isRTLElement } from '../utils/dom.js';
import { getViewportRect } from '../utils/rects.js';

/**
 * An alignment of a target relative to an anchor.
 *
 * @see {@link useAnchorPosition}
 * @group Behaviors
 */
export type AnchorAlign =
  | 'center'
  | 'start'
  | 'end'
  | 'exactCenter'
  | 'exactStart'
  | 'exactEnd'
  | 'innerCenter'
  | 'innerStart'
  | 'innerEnd'
  | 'outerStart'
  | 'outerEnd';

/**
 * Info about the current target position around an anchor.
 *
 * @see {@link AnchorPositionProps.onPositionChange}
 * @group Behaviors
 */
export interface AnchorPositionInfo {
  /**
   * A target rect.
   */
  targetRect: DOMRect;

  /**
   * An anchor rect around which a target is positioned.
   */
  anchorRect: DOMRect;

  /**
   * A bounding rect of a container that constrains target positioning.
   */
  containerRect: DOMRect;

  /**
   * A horizontal position of a target, relative to the window.
   */
  x: number;

  /**
   * A vertical position of a target, relative to the window.
   */
  y: number;

  /**
   * The maximum width of the target so it can fit into the container.
   */
  maxWidth: number;

  /**
   * The maximum height of the target so it can fit into the container.
   */
  maxHeight: number;

  /**
   * An arrow offset, relative to the target.
   *
   * `undefined` if {@link targetPlacement} isn't top, right, bottom, or left.
   */
  arrowOffset: number | undefined;

  /**
   * The position of the target relative to the anchor.
   *
   * <table>
   * <tr> <td>topLeft</td>     <td>top</td>     <td align="right">topRight</td>    </tr>
   * <tr> <td>left</td>        <td>center</td>  <td align="right">right</td>       </tr>
   * <tr> <td>bottomLeft</td>  <td>bottom</td>  <td align="right">bottomRight</td> </tr>
   * </table>
   */
  targetPlacement:
    | 'topLeft'
    | 'topRight'
    | 'top'
    | 'bottomLeft'
    | 'bottomRight'
    | 'bottom'
    | 'left'
    | 'right'
    | 'center';
}

/**
 * A variant of a target position around an anchor.
 *
 * @see {@link AnchorPositionProps.variants}
 * @group Behaviors
 */
export interface AnchorPositionVariant {
  /**
   * Horizontal padding inside a container that must be avoided during target placement.
   *
   * @default 0
   */
  containerPaddingX?: number;

  /**
   * Vertical padding inside a container that must be avoided during target placement.
   *
   * @default 0
   */
  containerPaddingY?: number;

  /**
   * Horizontal distance between an anchor and a target.
   *
   * @default 0
   */
  anchorMarginX?: number;

  /**
   * Vertical distance between an anchor and a target.
   *
   * @default 0
   */
  anchorMarginY?: number;

  /**
   * Width or height of an arrow, depending on preferred alignment.
   *
   * @default 0
   */
  arrowSize?: number;

  /**
   * A margin between an arrow and a target bounding rect.
   *
   * @default 0
   */
  arrowMargin?: number;

  /**
   * Horizontal alignment of a target relative to an anchor.
   *
   * @default "center"
   */
  alignX?: AnchorAlign;

  /**
   * Vertical alignment of a target relative to an anchor.
   *
   * @default "outerStart"
   */
  alignY?: AnchorAlign;

  /**
   * The minimum required width that must be available for the target.
   */
  minWidth?: number;

  /**
   * The minimum required height that must be available for the target.
   */
  minHeight?: number;
}

/**
 * Props for the {@link useAnchorPosition} hook.
 *
 * @group Behaviors
 */
export interface AnchorPositionProps {
  /**
   * Returns a bounding rect of the element positioned around an anchor.
   */
  getTargetRect: () => DOMRect | undefined;

  /**
   * Returns a bounding rect of an anchor (relative to the window) around which a target is positioned.
   */
  getAnchorRect: () => DOMRect | undefined;

  /**
   * Returns a bounding rect of a container that constrains target positioning.
   *
   * By default, the visual viewport is used as a container.
   */
  getContainerRect?: () => DOMRect | undefined;

  /**
   * If `true`, anchored positioning isn't tracked.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * An array of target position variants from which the most suitable is picked.
   *
   * By default, a single variant is used with {@link AnchorPositionVariant default settings}.
   */
  variants?: AnchorPositionVariant[];

  /**
   * If `true`, horizontal alignment is mirrored.
   *
   * By default, RTL is derived from the document.
   */
  isRTL?: boolean;

  /**
   * Called when the target element must be repositioned.
   *
   * @param info Info about the current target position around an anchor. This object is reused between invocations.
   */
  onPositionChange: (info: Readonly<AnchorPositionInfo>) => void;
}

/**
 * Positions a target element around an anchor element.
 *
 * @example
 * const anchorRef = useRef(null);
 * const targetRef = useRef(null);
 *
 * useAnchorPosition({
 *   getAnchorRect: () => anchorRef.current.getBoundingClientRect(),
 *   getTargetRect: () => targetRef.current.getBoundingClientRect(),
 *   variants: [
 *     {
 *       alignX: 'outerEnd',
 *       alignY: 'center',
 *     },
 *   ],
 *   onPositionChange(info) {
 *     targetRef.current.style.transform = `translateX(${info.x}px) translateY(${info.y}px)`;
 *   },
 * });
 *
 * <div ref={anchorRef} />
 * <div
 *   ref={targetRef}
 *   style={{ position: 'fixed' }}
 * />
 *
 * @param props Anchor position props.
 * @group Behaviors
 */
export function useAnchorPosition(props: AnchorPositionProps): void {
  const manager = useFunctionOnce(createAnchorPositionManager);

  manager.props = props;

  useLayoutEffect(manager.onDisabledUpdated, [props.isDisabled]);
}

const defaultVariants: AnchorPositionVariant[] = [{}];

interface AnchorPositionManager {
  props: AnchorPositionProps;
  onDisabledUpdated: EffectCallback;
}

function createAnchorPositionManager(): AnchorPositionManager {
  let handle = 0;

  let prevX: number;
  let prevY: number;
  let prevMaxWidth: number;
  let prevMaxHeight: number;
  let prevArrowOffset: number | undefined;
  let prevActualAlignY: AnchorAlign;
  let prevActualAlignX: AnchorAlign;

  const info: AnchorPositionInfo = {
    targetRect: undefined!,
    anchorRect: undefined!,
    containerRect: undefined!,
    x: 0,
    y: 0,
    maxWidth: 0,
    maxHeight: 0,
    arrowOffset: undefined,
    targetPlacement: 'center',
  };

  const handleDisabledUpdated: EffectCallback = () => {
    if (!manager.props.isDisabled) {
      frameRequestCallback();
    }

    return () => cancelAnimationFrame(handle);
  };

  const frameRequestCallback = () => {
    const {
      getTargetRect,
      getAnchorRect,
      getContainerRect = getViewportRect,
      variants = defaultVariants,
      isRTL = isRTLElement(),
      onPositionChange,
    } = manager.props;

    const anchorRect = getAnchorRect();
    const targetRect = getTargetRect();
    const containerRect = getContainerRect() || getViewportRect();

    if (anchorRect === undefined || targetRect === undefined || variants.length === 0) {
      // Nothing to anchor, or no position variants.
      prevMaxWidth = prevMaxHeight = -1;

      handle = requestAnimationFrame(frameRequestCallback);
      return;
    }

    let pickedVariantIndex = 0;
    let pickedVariantScore = 0;

    let x = 0;
    let y = 0;
    let maxWidth = 0;
    let maxHeight = 0;
    let actualAlignX = ALIGN_CENTER;
    let actualAlignY = ALIGN_CENTER;
    let arrowOffset: number | undefined;

    for (let i = 0, isPicked = false; i < variants.length; ++i) {
      const {
        containerPaddingX = 0,
        containerPaddingY = 0,
        anchorMarginX = 0,
        anchorMarginY = 0,
        arrowSize = 0,
        arrowMargin = 0,
        alignX = ALIGN_CENTER,
        alignY = ALIGN_OUTER_START,
        minWidth = targetRect.width,
        minHeight = targetRect.height,
      } = variants[i];

      // X
      state.containerA = containerRect.x;
      state.containerB = containerRect.right;
      state.anchorA = anchorRect.x;
      state.anchorB = anchorRect.right;
      state.targetA = targetRect.x;
      state.targetB = targetRect.right;
      state.isRTL = isRTL;
      state.containerPadding = containerPaddingX;
      state.anchorMargin = anchorMarginX;
      state.arrowSize = arrowSize;
      state.arrowMargin = arrowMargin;
      state.align = alignX;

      updateAnchorPosition(state);

      x = state.position;
      maxWidth = state.maxSize;
      actualAlignX = state.actualAlign;
      arrowOffset = state.arrowOffset;

      // Y
      state.containerA = containerRect.y;
      state.containerB = containerRect.bottom;
      state.anchorA = anchorRect.y;
      state.anchorB = anchorRect.bottom;
      state.targetA = targetRect.y;
      state.targetB = targetRect.bottom;
      state.isRTL = false;
      state.containerPadding = containerPaddingY;
      state.anchorMargin = anchorMarginY;
      state.arrowSize = arrowSize;
      state.arrowMargin = arrowMargin;
      state.align = alignY;

      updateAnchorPosition(state);

      y = state.position;
      maxHeight = state.maxSize;
      actualAlignY = state.actualAlign;
      arrowOffset = arrowOffset === undefined ? state.arrowOffset : arrowOffset;

      if (
        isPicked ||
        ((minWidth !== undefined || minHeight !== undefined) &&
          (minWidth === undefined || maxWidth >= minWidth) &&
          (minHeight === undefined || maxHeight >= minHeight))
      ) {
        break;
      }

      // Check constraints and pick a variant.
      if (maxWidth * maxHeight > pickedVariantScore) {
        pickedVariantIndex = i;
        pickedVariantScore = maxWidth * maxHeight;
      }

      if (i === variants.length - 1 && i !== pickedVariantIndex) {
        i = pickedVariantIndex - 1;
        isPicked = true;
      }
    }

    handle = requestAnimationFrame(frameRequestCallback);

    if (
      prevX === x &&
      prevY === y &&
      prevMaxWidth === maxWidth &&
      prevMaxHeight === maxHeight &&
      prevArrowOffset === arrowOffset &&
      prevActualAlignX === actualAlignX &&
      prevActualAlignY === actualAlignY
    ) {
      return;
    }

    prevActualAlignX = actualAlignX;
    prevActualAlignY = actualAlignY;

    info.containerRect = containerRect;
    info.anchorRect = anchorRect;
    info.targetRect = targetRect;
    info.x = prevX = x;
    info.y = prevY = y;
    info.maxWidth = prevMaxWidth = maxWidth;
    info.maxHeight = prevMaxHeight = maxHeight;
    info.arrowOffset = prevArrowOffset = arrowOffset;
    info.targetPlacement =
      actualAlignY === ALIGN_OUTER_START
        ? actualAlignX === ALIGN_OUTER_START
          ? 'topLeft'
          : actualAlignX === ALIGN_OUTER_END
            ? 'topRight'
            : 'top'
        : actualAlignY === ALIGN_OUTER_END
          ? actualAlignX === ALIGN_OUTER_START
            ? 'bottomLeft'
            : actualAlignX === ALIGN_OUTER_END
              ? 'bottomRight'
              : 'bottom'
          : actualAlignX === ALIGN_OUTER_START
            ? 'left'
            : actualAlignX === ALIGN_OUTER_END
              ? 'right'
              : 'center';

    onPositionChange(info);
  };

  const manager: AnchorPositionManager = {
    props: undefined!,
    onDisabledUpdated: handleDisabledUpdated,
  };

  return manager;
}

const ALIGN_CENTER: AnchorAlign = 'center';
const ALIGN_START: AnchorAlign = 'start';
const ALIGN_END: AnchorAlign = 'end';
const ALIGN_EXACT_CENTER: AnchorAlign = 'exactCenter';
const ALIGN_EXACT_START: AnchorAlign = 'exactStart';
const ALIGN_EXACT_END: AnchorAlign = 'exactEnd';
const ALIGN_INNER_CENTER: AnchorAlign = 'innerCenter';
const ALIGN_INNER_START: AnchorAlign = 'innerStart';
const ALIGN_INNER_END: AnchorAlign = 'innerEnd';
const ALIGN_OUTER_START: AnchorAlign = 'outerStart';
const ALIGN_OUTER_END: AnchorAlign = 'outerEnd';

/**
 * The internal state object reused by all {@link AnchorPositionManager} instances.
 */
const state: AnchorPositionState = {
  // Input
  containerA: 0,
  containerB: 0,
  anchorA: 0,
  anchorB: 0,
  targetA: 0,
  targetB: 0,
  isRTL: false,
  containerPadding: 0,
  anchorMargin: 0,
  arrowSize: 0,
  arrowMargin: 0,
  align: ALIGN_CENTER,

  // Output
  position: 0,
  maxSize: 0,
  actualAlign: ALIGN_CENTER,
  arrowOffset: undefined,
};

const { min, max } = Math;

export interface AnchorPositionState {
  // Input
  containerA: number;
  containerB: number;
  anchorA: number;
  anchorB: number;
  targetA: number;
  targetB: number;
  isRTL: boolean;
  containerPadding: number;
  anchorMargin: number;
  arrowSize: number;
  arrowMargin: number;
  align: AnchorAlign;

  // Output
  position: number;
  maxSize: number;
  actualAlign: AnchorAlign;
  arrowOffset: number | undefined;
}

export function updateAnchorPosition(state: AnchorPositionState): void {
  const { anchorA, anchorB, targetA, targetB, isRTL, containerPadding, anchorMargin, arrowSize, arrowMargin } = state;

  const containerA = state.containerA + containerPadding;
  const containerB = state.containerB - containerPadding;

  const align = isRTL ? alignFlipTable[state.align] : state.align;

  const targetSize = targetB - targetA;

  const arrowSpacing = min(targetSize, 2 * arrowMargin + arrowSize);

  let position: number;
  let maxSize: number;
  let actualAlign = align;
  let arrowOffset: number | undefined;

  let startSize: number;
  let endSize: number;

  let minPosition: number;
  let maxPosition: number;

  if (align === ALIGN_OUTER_START || align === ALIGN_OUTER_END) {
    // Available size
    startSize = anchorA - containerA;
    endSize = containerB - anchorB;

    if (align === ALIGN_OUTER_START) {
      position = anchorA - anchorMargin - targetSize;
      maxSize = startSize - anchorMargin;
      actualAlign = ALIGN_OUTER_START;
    } else {
      position = anchorB + anchorMargin;
      maxSize = endSize - anchorMargin;
      actualAlign = ALIGN_OUTER_END;
    }
  } else {
    // Desired position
    if (align === ALIGN_START || align === ALIGN_EXACT_START || align === ALIGN_INNER_START) {
      position = anchorA + anchorMargin;
    } else if (align === ALIGN_END || align === ALIGN_EXACT_END || align === ALIGN_INNER_END) {
      position = anchorB - anchorMargin - targetSize;
    } else {
      position = anchorA + (anchorB - anchorA - targetSize) / 2;
    }

    maxSize = containerB - containerA;

    if (align === ALIGN_EXACT_START) {
      maxSize = containerB - position;
    }
    if (align === ALIGN_EXACT_END) {
      maxSize = anchorB - anchorMargin - containerA;
    }

    // Clamp position
    if (
      align === ALIGN_CENTER ||
      align === ALIGN_START ||
      align === ALIGN_END ||
      align === ALIGN_INNER_CENTER ||
      align === ALIGN_INNER_START ||
      align === ALIGN_INNER_END
    ) {
      if (align === ALIGN_CENTER || align === ALIGN_START || align === ALIGN_END) {
        minPosition = min(containerA, anchorB - anchorMargin - arrowSpacing);
        maxPosition = max(containerB - targetSize, anchorA - targetSize + anchorMargin + arrowSpacing);
      } else {
        minPosition = min(containerA, max(anchorA + anchorMargin, anchorB - targetSize - anchorMargin));
        maxPosition = max(containerB - targetSize, min(anchorA + anchorMargin, anchorB - targetSize - anchorMargin));
      }

      if (isRTL) {
        position = min(max(minPosition, position), maxPosition);
      } else {
        position = max(minPosition, min(position, maxPosition));
      }
    }

    arrowOffset =
      max(0, anchorA - position) + (min(position + targetSize, anchorB) - max(position, anchorA) - arrowSize) / 2;
  }

  state.position = position;
  state.maxSize = max(0, min(maxSize, containerB - containerA));
  state.actualAlign = actualAlign;
  state.arrowOffset = arrowOffset;
}

const alignFlipTable: Record<AnchorAlign, AnchorAlign> = {
  [ALIGN_CENTER]: ALIGN_CENTER,
  [ALIGN_START]: ALIGN_END,
  [ALIGN_END]: ALIGN_START,
  [ALIGN_EXACT_CENTER]: ALIGN_EXACT_CENTER,
  [ALIGN_EXACT_START]: ALIGN_EXACT_END,
  [ALIGN_EXACT_END]: ALIGN_EXACT_START,
  [ALIGN_INNER_CENTER]: ALIGN_INNER_CENTER,
  [ALIGN_INNER_START]: ALIGN_INNER_END,
  [ALIGN_INNER_END]: ALIGN_INNER_START,
  [ALIGN_OUTER_START]: ALIGN_OUTER_END,
  [ALIGN_OUTER_END]: ALIGN_OUTER_START,
};
