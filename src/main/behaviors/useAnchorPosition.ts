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
  | 'outerEnd'
  | 'preferOuterStart'
  | 'preferOuterEnd';

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
   */
  arrowOffset: number;

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
   * A reference to an element that is positioned around an {@link AnchorPositionProps.getAnchorRect anchor rect}.
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
   * By default, window is the viewport.
   */
  viewportRef?: RefObject<Element>;

  /**
   * A horizontal padding inside a {@link viewportRef viewport} that must be avoided during a {@link targetRef target}
   * placement.
   *
   * @default 0
   */
  viewportPaddingX?: number;

  /**
   * A vertical padding inside a {@link viewportRef viewport} that must be avoided during a {@link targetRef target}
   * placement.
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
   * A margin between an arrow and a {@link targetRef target} bonding rect.
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
   * @default "preferOuterStart"
   */
  alignY?: AnchorAlign;

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
 * @param props Anchor position props.
 * @group Behaviors
 */
export function useAnchorPosition(props: AnchorPositionProps): void {
  const manager = useFunction(createAnchorPositionManager);

  manager.props = props;

  useLayoutEffect(manager.onDisabledUpdated, [props.isDisabled]);
}

const memory = new Int32Array(21);

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
  let prevArrowOffset: number;
  let prevTargetPlacement: string | undefined;

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
    arrowOffset: 0,
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
      getAnchorRect,
      targetRef,
      viewportRef,
      viewportPaddingX = 0,
      viewportPaddingY = 0,
      anchorMarginX = 0,
      anchorMarginY = 0,
      arrowSize = 0,
      arrowMargin = 0,
      alignX = 'center',
      alignY = 'preferOuterStart',
      onPositionChange,
    } = manager.props;

    if (targetRef.current === null) {
      // Nothing to anchor
      prevMaxWidth = prevMaxHeight = -1;

      handle = requestAnimationFrame(frameRequestCallback);
      return;
    }

    const target = targetRef.current;

    const anchorRect = getAnchorRect();
    const targetRect = target.getBoundingClientRect();

    const viewport = viewportRef === undefined ? null : viewportRef.current;
    const viewportRect = getViewportRect(viewport);

    // viewportX1
    // viewportY1
    // viewportX2
    // viewportY2
    memory[0] = viewportRect.x;
    memory[1] = viewportRect.y;
    memory[2] = viewportRect.right;
    memory[3] = viewportRect.bottom;

    // viewportPaddingX
    // viewportPaddingY
    memory[4] = viewportPaddingX;
    memory[5] = viewportPaddingY;

    // anchorX1
    // anchorY1
    // anchorX2
    // anchorY2
    memory[6] = anchorRect.x;
    memory[7] = anchorRect.y;
    memory[8] = anchorRect.right;
    memory[9] = anchorRect.bottom;

    // anchorMarginX
    // anchorMarginY
    memory[10] = anchorMarginX;
    memory[11] = anchorMarginY;

    // targetX1
    // targetY1
    // targetX2
    // targetY2
    memory[12] = targetRect.x;
    memory[13] = targetRect.y;
    memory[14] = targetRect.right;
    memory[15] = targetRect.bottom;

    // arrowSize
    // arrowMargin
    memory[16] = arrowSize;
    memory[17] = arrowMargin;

    // direction
    memory[18] = document.dir === 'rtl' ? DIRECTION_RTL : DIRECTION_LTR;

    // alignX
    // alignY
    memory[19] = encodeAlignTable[alignX];
    memory[20] = encodeAlignTable[alignY];

    calcAnchorPosition(memory);

    const x = memory[0];
    const y = memory[1];
    const maxWidth = memory[2];
    const maxHeight = memory[3];
    const actualAlignX = memory[4];
    const actualAlignY = memory[5];
    const arrowOffset = memory[6];

    const targetPlacement =
      actualAlignY === ALIGN_START_OUTER
        ? actualAlignX === ALIGN_START_OUTER
          ? 'topLeft'
          : actualAlignX === ALIGN_END_OUTER
            ? 'topRight'
            : 'top'
        : actualAlignY === ALIGN_END_OUTER
          ? actualAlignX === ALIGN_START_OUTER
            ? 'bottomLeft'
            : actualAlignX === ALIGN_END_OUTER
              ? 'bottomRight'
              : 'bottom'
          : actualAlignX === ALIGN_START_OUTER
            ? 'left'
            : actualAlignX === ALIGN_END_OUTER
              ? 'right'
              : 'center';

    handle = requestAnimationFrame(frameRequestCallback);

    if (
      prevX === x &&
      prevY === y &&
      prevMaxWidth === maxWidth &&
      prevMaxHeight === maxHeight &&
      prevArrowOffset === arrowOffset &&
      prevTargetPlacement === targetPlacement
    ) {
      return;
    }

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
    info.targetPlacement = prevTargetPlacement = targetPlacement;

    onPositionChange(info);
  };

  const manager: AnchorPositionManager = {
    props: undefined!,
    onDisabledUpdated: handleDisabledUpdated,
  };

  return manager;
}

// prettier-ignore
const
  ALIGN_MASK               = 0b11,
  ALIGN_EXACT              = 0b00100,
  ALIGN_INNER              = 0b01000,
  ALIGN_OUTER              = 0b10000,
  ALIGN_OUTER_PREFER       = 0b11000,

  ALIGN_CENTER             = 0b00,
  ALIGN_CENTER_EXACT       = ALIGN_CENTER | ALIGN_EXACT,
  ALIGN_CENTER_INNER       = ALIGN_CENTER | ALIGN_INNER,

  ALIGN_START              = 0b01,
  ALIGN_START_EXACT        = ALIGN_START | ALIGN_EXACT,
  ALIGN_START_INNER        = ALIGN_START | ALIGN_INNER,
  ALIGN_START_OUTER        = ALIGN_START | ALIGN_OUTER,
  ALIGN_START_OUTER_PREFER = ALIGN_START | ALIGN_OUTER_PREFER,

  ALIGN_END                = 0b10,
  ALIGN_END_EXACT          = ALIGN_END | ALIGN_EXACT,
  ALIGN_END_INNER          = ALIGN_END | ALIGN_INNER,
  ALIGN_END_OUTER          = ALIGN_END | ALIGN_OUTER,
  ALIGN_END_OUTER_PREFER   = ALIGN_END | ALIGN_OUTER_PREFER;

const DIRECTION_LTR = 0;
const DIRECTION_RTL = 1;

const { min, max } = Math;

function calcAnchorPosition(memory: { [value: number]: number }): void {
  const viewportPaddingX = memory[4];
  const viewportPaddingY = memory[5];

  const viewportX1 = memory[0] + viewportPaddingX;
  const viewportY1 = memory[1] + viewportPaddingY;
  const viewportX2 = memory[2] - viewportPaddingX;
  const viewportY2 = memory[3] - viewportPaddingY;

  const anchorX1 = memory[6];
  const anchorY1 = memory[7];
  const anchorX2 = memory[8];
  const anchorY2 = memory[9];

  const anchorMarginX = memory[10];
  const anchorMarginY = memory[11];

  const targetX1 = memory[12];
  const targetY1 = memory[13];
  const targetX2 = memory[14];
  const targetY2 = memory[15];

  const arrowSize = memory[16];
  const arrowMargin = memory[17];

  const direction = memory[18];

  const alignX =
    direction === DIRECTION_LTR || (memory[19] & ALIGN_MASK) === ALIGN_CENTER ? memory[19] : memory[19] ^ ALIGN_MASK;
  const alignY = memory[20];

  const targetWidth = targetX2 - targetX1;
  const targetHeight = targetY2 - targetY1;

  const arrowSpacingX = min(targetWidth, 2 * arrowMargin + arrowSize);
  const arrowSpacingY = min(targetHeight, 2 * arrowMargin + arrowSize);

  let x;
  let y;

  let maxWidth;
  let maxHeight;

  let actualAlignX = alignX;
  let actualAlignY = alignY;
  let arrowOffset = null;

  let topHeight;
  let bottomHeight;
  let leftWidth;
  let rightWidth;

  let minCoord = null;
  let maxCoord = null;

  if (
    alignX === ALIGN_START_OUTER ||
    alignX === ALIGN_END_OUTER ||
    alignX === ALIGN_START_OUTER_PREFER ||
    alignX === ALIGN_END_OUTER_PREFER
  ) {
    // Available width
    leftWidth = anchorX1 - viewportX1;
    rightWidth = viewportX2 - anchorX2;

    if (
      alignX === ALIGN_START_OUTER ||
      (alignX !== ALIGN_END_OUTER &&
        (alignX === ALIGN_START_OUTER_PREFER
          ? leftWidth >= rightWidth + 1 || leftWidth >= targetWidth + anchorMarginX + 1
          : leftWidth >= rightWidth + 1 && rightWidth <= targetWidth + anchorMarginX))
    ) {
      x = anchorX1 - anchorMarginX - targetWidth;
      maxWidth = leftWidth - anchorMarginX;
      actualAlignX = ALIGN_START_OUTER;
    } else {
      x = anchorX2 + anchorMarginX;
      maxWidth = rightWidth - anchorMarginX;
      actualAlignX = ALIGN_END_OUTER;
    }
  } else {
    // Desired position
    if (alignX === ALIGN_START || alignX === ALIGN_START_EXACT || alignX === ALIGN_START_INNER) {
      x = anchorX1 + anchorMarginX;
    } else if (alignX === ALIGN_END || alignX === ALIGN_END_EXACT || alignX === ALIGN_END_INNER) {
      x = anchorX2 - anchorMarginX - targetWidth;
    } else {
      x = anchorX1 + (anchorX2 - anchorX1 - targetWidth) / 2;
    }

    maxWidth = viewportX2 - viewportX1;

    if (alignX === ALIGN_START_EXACT) {
      maxWidth = viewportX2 - x;
    }
    if (alignX === ALIGN_END_EXACT) {
      maxWidth = anchorX2 - anchorMarginX - viewportX1;
    }

    // Clamp position to viewport
    if (alignX === ALIGN_START || alignX === ALIGN_END || alignX === ALIGN_CENTER) {
      minCoord = min(viewportX1, anchorX2 - anchorMarginX - arrowSpacingX);
      maxCoord = max(viewportX2 - targetWidth, anchorX1 - targetWidth + anchorMarginX + arrowSpacingX);
    }

    if (alignX === ALIGN_START_INNER || alignX === ALIGN_END_INNER || alignX === ALIGN_CENTER_INNER) {
      minCoord = min(viewportX1, anchorX1 + anchorMarginX);
      maxCoord = max(viewportX2 - targetWidth, anchorX2 - targetWidth - anchorMarginX);
    }

    if (minCoord !== null && maxCoord !== null) {
      if (direction === DIRECTION_LTR) {
        x = max(minCoord, min(x, maxCoord));
      } else {
        x = min(max(minCoord, x), maxCoord);
      }

      minCoord = maxCoord = null;
    }

    arrowOffset = max(0, anchorX1 - x) + (min(x + targetWidth, anchorX2) - max(x, anchorX1) - arrowSize) / 2;
  }

  if (
    alignY === ALIGN_START_OUTER ||
    alignY === ALIGN_START_OUTER_PREFER ||
    alignY === ALIGN_END_OUTER ||
    alignY === ALIGN_END_OUTER_PREFER
  ) {
    // Available height
    topHeight = anchorY1 - viewportY1;
    bottomHeight = viewportY2 - anchorY2;

    if (
      alignY === ALIGN_START_OUTER ||
      (alignY !== ALIGN_END_OUTER &&
        (alignY === ALIGN_START_OUTER_PREFER
          ? topHeight >= bottomHeight + 1 || topHeight >= targetHeight + anchorMarginY + 1
          : topHeight >= bottomHeight + 1 && bottomHeight <= targetHeight + anchorMarginY))
    ) {
      y = anchorY1 - anchorMarginY - targetHeight;
      maxHeight = topHeight - anchorMarginY;
      actualAlignY = ALIGN_START_OUTER;
    } else {
      y = anchorY2 + anchorMarginY;
      maxHeight = bottomHeight - anchorMarginY;
      actualAlignY = ALIGN_END_OUTER;
    }
  } else {
    // Desired position
    if (alignY === ALIGN_START || alignY === ALIGN_START_EXACT || alignY === ALIGN_START_INNER) {
      y = anchorY1 + anchorMarginY;
    } else if (alignY === ALIGN_END || alignY === ALIGN_END_EXACT || alignY === ALIGN_END_INNER) {
      y = anchorY2 - anchorMarginY - targetHeight;
    } else {
      y = anchorY1 + (anchorY2 - anchorY1 - targetHeight) / 2;
    }

    maxHeight = viewportY2 - viewportY1;

    if (alignY === ALIGN_START_EXACT) {
      maxHeight = viewportY2 - y;
    }
    if (alignY === ALIGN_END_EXACT) {
      maxHeight = anchorY2 - anchorMarginY - viewportY1;
    }

    // Clamp position to viewport
    if (alignY === ALIGN_START || alignY === ALIGN_END || alignY === ALIGN_CENTER) {
      minCoord = min(viewportY1, anchorY2 - anchorMarginY - arrowSpacingY);
      maxCoord = max(viewportY2 - targetHeight, anchorY1 - targetHeight + anchorMarginY + arrowSpacingY);
    }

    if (alignY === ALIGN_START_INNER || alignY === ALIGN_END_INNER || alignY === ALIGN_CENTER_INNER) {
      minCoord = min(viewportY1, anchorY1 + anchorMarginY);
      maxCoord = max(viewportY2 - targetHeight, anchorY2 - targetHeight - anchorMarginY);
    }

    if (minCoord !== null && maxCoord !== null) {
      y = max(minCoord, min(y, maxCoord));
    }

    if (arrowOffset === null) {
      arrowOffset = max(0, anchorY1 - y) + (min(y + targetHeight, anchorY2) - max(y, anchorY1) - arrowSize) / 2;
    }
  }

  memory[0] = x;
  memory[1] = y;
  memory[2] = max(0, min(maxWidth, viewportX2 - viewportX1));
  memory[3] = max(0, min(maxHeight, viewportY2 - viewportY1));
  memory[4] = actualAlignX;
  memory[5] = actualAlignY;
  memory[6] = arrowOffset === null ? 0 : arrowOffset;
}

// prettier-ignore
const encodeAlignTable: Record<AnchorAlign, number> = {
  center:           ALIGN_CENTER,
  start:            ALIGN_START,
  end:              ALIGN_END,
  exactCenter:      ALIGN_CENTER_EXACT,
  exactStart:       ALIGN_START_EXACT,
  exactEnd:         ALIGN_END_EXACT,
  innerCenter:      ALIGN_CENTER_INNER,
  innerStart:       ALIGN_START_INNER,
  innerEnd:         ALIGN_END_INNER,
  outerStart:       ALIGN_START_OUTER,
  outerEnd:         ALIGN_END_OUTER,
  preferOuterStart: ALIGN_START_OUTER_PREFER,
  preferOuterEnd:   ALIGN_END_OUTER_PREFER,
};
