import { EffectCallback, RefObject, useLayoutEffect } from 'react';
import { useFunction } from '../useFunction';
import { getViewportRect } from '../utils/rects';

/**
 * An alignment of a {@link AnchorPositionProps.targetRef target} element relative to
 * an {@link AnchorPositionProps.getAnchorRect anchor rect}.
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
 * An info about the current target position around an anchor.
 *
 * @see {@link AnchorPositionProps.onPositionChange}
 * @group Behaviors
 */
export interface AnchorPositionInfo {
  /**
   * An element that is a viewport that constrains the target positioning, or `null` if window is a viewport.
   */
  viewport: Element | null;

  /**
   * An element that is positioned around an anchor rect.
   */
  target: Element;

  /**
   * A bounding rect of a viewport.
   */
  viewportRect: DOMRect;

  /**
   * An anchor rect around which a target element is positioned.
   */
  anchorRect: DOMRect;

  /**
   * A bounding rect of a {@link target} element.
   */
  targetRect: DOMRect;

  /**
   * A horizontal position of a {@link target}, relative to a {@link viewport}.
   */
  x: number;

  /**
   * A vertical position of a {@link target}, relative to a {@link viewport}.
   */
  y: number;

  /**
   * The maximum width of a {@link target} that can fit into a {@link viewport}.
   */
  maxWidth: number;

  /**
   * The maximum height of a {@link target} that can fit into a {@link viewport}.
   */
  maxHeight: number;

  /**
   * An arrow offset, relative to a {@link target}.
   *
   * `undefined` if {@link targetPlacement} isn't top, right, bottom or left.
   */
  arrowOffset: number | undefined;

  /**
   * The position of a target, relative to the anchor.
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
   * A horizontal padding inside a {@link AnchorPositionProps.viewportRef viewport} that must be avoided during
   * a {@link AnchorPositionProps.targetRef target} placement.
   *
   * @default 0
   */
  viewportPaddingX?: number;

  /**
   * A vertical padding inside a {@link AnchorPositionProps.viewportRef viewport} that must be avoided during
   * a {@link AnchorPositionProps.targetRef target} placement.
   *
   * @default 0
   */
  viewportPaddingY?: number;

  /**
   * A horizontal distance between an {@link AnchorPositionProps.getAnchorRect anchor rect} and
   * a {@link targetRef target}.
   *
   * @default 0
   */
  anchorMarginX?: number;

  /**
   * A vertical distance between an {@link AnchorPositionProps.getAnchorRect anchor rect} and
   * a {@link targetRef target}.
   *
   * @default 0
   */
  anchorMarginY?: number;

  /**
   * A width or height of an arrow, depending on preferred alignment.
   *
   * @default 0
   */
  arrowSize?: number;

  /**
   * A margin between an arrow and a {@link AnchorPositionProps.targetRef target} bonding rect.
   *
   * @default 0
   */
  arrowMargin?: number;

  /**
   * A horizontal alignment of a {@link targetRef target} relative to
   * an {@link AnchorPositionProps.getAnchorRect anchor rect}.
   *
   * @default "center"
   */
  alignX?: AnchorAlign;

  /**
   * A vertical alignment of a {@link targetRef target} relative to
   * an {@link AnchorPositionProps.getAnchorRect anchor rect}.
   *
   * @default "outerStart"
   */
  alignY?: AnchorAlign;

  /**
   * The minimum required width that must be available for a target.
   */
  minWidth?: number;

  /**
   * The minimum required height that must be available for a target.
   */
  minHeight?: number;
}

/**
 * Props of the {@link useAnchorPosition} hook.
 *
 * @see {@link useAnchorPosition}
 * @group Behaviors
 */
export interface AnchorPositionProps {
  /**
   * Returns a bounding box of an anchor relative to a window viewport around which a {@link targetRef target} is
   * positioned.
   */
  getAnchorRect: () => DOMRect;

  /**
   * A reference to an element that is positioned around an {@link getAnchorRect anchor rect}.
   */
  targetRef: RefObject<Element>;

  /**
   * If `true` then anchored position of a target element isn't tracked.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * A reference to an element that is a viewport that constrains the target positioning.
   *
   * If omitted or `current is `null`, then the window is used as a viewport.
   */
  viewportRef?: RefObject<Element>;

  /**
   * An array of target position variants from which the most suitable is picked.
   *
   * By default, a single variant is used with {@link AnchorPositionVariant default settings}.
   */
  variants?: AnchorPositionVariant[];

  /**
   * A handler that is called when the {@link targetRef target} element must be repositioned.
   *
   * @param info An info about the current target position around an anchor. The info object is reused between handler
   * invocations.
   */
  onPositionChange: (info: Readonly<AnchorPositionInfo>) => void;
}

/**
 * Positions a target element around the anchor element.
 *
 * @example
 * const anchorRef = useRef(null);
 * const targetRef = useRef(null);
 *
 * useAnchorPosition({
 *   getAnchorRect: () => anchorRef.current.getBoundingClientRect(),
 *   targetRef,
 *   variants: [
 *     {
 *       alignX: 'outerEnd',
 *       alignY: 'center',
 *     },
 *   ],
 *   onPositionChange: info => {
 *     info.target.style.transform = `translateX(${info.x}px) translateY(${info.y}px)`;
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
  const manager = useFunction(createAnchorPositionManager);

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
    viewport: null,
    target: undefined!,
    viewportRect: undefined!,
    anchorRect: undefined!,
    targetRect: undefined!,
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
    const { getAnchorRect, targetRef, viewportRef, variants = defaultVariants, onPositionChange } = manager.props;

    if (targetRef.current === null || variants.length === 0) {
      // Nothing to anchor, or no position variants
      prevMaxWidth = prevMaxHeight = -1;

      handle = requestAnimationFrame(frameRequestCallback);
      return;
    }

    const target = targetRef.current;

    const anchorRect = getAnchorRect();
    const targetRect = target.getBoundingClientRect();

    const viewport = viewportRef === undefined ? null : viewportRef.current;
    const viewportRect = getViewportRect(viewport);

    const direction = document.dir === 'rtl' ? DIRECTION_RTL : DIRECTION_LTR;

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
        viewportPaddingX = 0,
        viewportPaddingY = 0,
        anchorMarginX = 0,
        anchorMarginY = 0,
        arrowSize = 0,
        arrowMargin = 0,
        alignX = ALIGN_CENTER,
        alignY = ALIGN_OUTER_START,
        minWidth,
        minHeight,
      } = variants[i];

      // X
      input.viewportA = viewportRect.x;
      input.viewportB = viewportRect.right;
      input.anchorA = anchorRect.x;
      input.anchorB = anchorRect.right;
      input.targetA = targetRect.x;
      input.targetB = targetRect.right;
      input.direction = direction;
      input.viewportPadding = viewportPaddingX;
      input.anchorMargin = anchorMarginX;
      input.arrowSize = arrowSize;
      input.arrowMargin = arrowMargin;
      input.align = alignX;

      calcAnchorPosition(input, output);

      x = output.position;
      maxWidth = output.maxSize;
      actualAlignX = output.actualAlign;
      arrowOffset = output.arrowOffset;

      // Y
      input.viewportA = viewportRect.y;
      input.viewportB = viewportRect.bottom;
      input.anchorA = anchorRect.y;
      input.anchorB = anchorRect.bottom;
      input.targetA = targetRect.y;
      input.targetB = targetRect.bottom;
      input.direction = DIRECTION_LTR;
      input.viewportPadding = viewportPaddingY;
      input.anchorMargin = anchorMarginY;
      input.arrowSize = arrowSize;
      input.arrowMargin = arrowMargin;
      input.align = alignY;

      calcAnchorPosition(input, output);

      y = output.position;
      maxHeight = output.maxSize;
      actualAlignY = output.actualAlign;
      arrowOffset = arrowOffset === undefined ? output.arrowOffset : arrowOffset;

      if (isPicked) {
        break;
      }

      // Check constraints and pick a variant

      if (maxWidth * maxHeight > pickedVariantScore) {
        pickedVariantIndex = i;
        pickedVariantScore = maxWidth * maxHeight;
      }

      if (
        (minWidth !== undefined || minHeight !== undefined) &&
        (minWidth === undefined || maxWidth >= minWidth) &&
        (minHeight === undefined || maxHeight >= minHeight)
      ) {
        break;
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

    info.viewport = viewport;
    info.target = target;
    info.viewportRect = viewportRect;
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

const DIRECTION_LTR = 'ltr';
const DIRECTION_RTL = 'rtl';

const input: CalcAnchorPositionInput = {
  viewportA: 0,
  viewportB: 0,
  anchorA: 0,
  anchorB: 0,
  targetA: 0,
  targetB: 0,
  direction: DIRECTION_LTR,
  viewportPadding: 0,
  anchorMargin: 0,
  arrowSize: 0,
  arrowMargin: 0,
  align: ALIGN_CENTER,
};

const output: CalcAnchorPositionOutput = {
  position: 0,
  maxSize: 0,
  actualAlign: ALIGN_CENTER,
  arrowOffset: undefined,
};

const { min, max } = Math;

export interface CalcAnchorPositionInput {
  viewportA: number;
  viewportB: number;
  anchorA: number;
  anchorB: number;
  targetA: number;
  targetB: number;
  direction: 'rtl' | 'ltr';
  viewportPadding: number;
  anchorMargin: number;
  arrowSize: number;
  arrowMargin: number;
  align: AnchorAlign;
}

export interface CalcAnchorPositionOutput {
  position: number;
  maxSize: number;
  actualAlign: AnchorAlign;
  arrowOffset: number | undefined;
}

export function calcAnchorPosition(input: CalcAnchorPositionInput, output: CalcAnchorPositionOutput): void {
  const { anchorA, anchorB, targetA, targetB, direction, viewportPadding, anchorMargin, arrowSize, arrowMargin } =
    input;

  const viewportA = input.viewportA + viewportPadding;
  const viewportB = input.viewportB - viewportPadding;

  const align = direction === DIRECTION_LTR ? input.align : alignFlipTable[input.align];

  const targetSize = targetB - targetA;

  const arrowSpacing = min(targetSize, 2 * arrowMargin + arrowSize);

  let position;
  let maxSize;
  let actualAlign = align;
  let arrowOffset;

  let startSize;
  let endSize;

  let minPosition;
  let maxPosition;

  if (align === ALIGN_OUTER_START || align === ALIGN_OUTER_END) {
    // Available size
    startSize = anchorA - viewportA;
    endSize = viewportB - anchorB;

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

    maxSize = viewportB - viewportA;

    if (align === ALIGN_EXACT_START) {
      maxSize = viewportB - position;
    }
    if (align === ALIGN_EXACT_END) {
      maxSize = anchorB - anchorMargin - viewportA;
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
        minPosition = min(viewportA, anchorB - anchorMargin - arrowSpacing);
        maxPosition = max(viewportB - targetSize, anchorA - targetSize + anchorMargin + arrowSpacing);
      } else {
        minPosition = min(viewportA, max(anchorA + anchorMargin, anchorB - targetSize - anchorMargin));
        maxPosition = max(viewportB - targetSize, min(anchorA + anchorMargin, anchorB - targetSize - anchorMargin));
      }

      if (direction === DIRECTION_LTR) {
        position = max(minPosition, min(position, maxPosition));
      } else {
        position = min(max(minPosition, position), maxPosition);
      }
    }

    arrowOffset =
      max(0, anchorA - position) + (min(position + targetSize, anchorB) - max(position, anchorA) - arrowSize) / 2;
  }

  output.position = position;
  output.maxSize = max(0, min(maxSize, viewportB - viewportA));
  output.actualAlign = actualAlign;
  output.arrowOffset = arrowOffset;
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
