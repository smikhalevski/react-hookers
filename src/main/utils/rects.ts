const { min, max } = Math;

/**
 * Returns a rectangle that bounds the intersection of two rectangles.
 *
 * @group Other
 */
export function intersectRects(a: DOMRect, b: DOMRect): DOMRect {
  const ax1 = a.left;
  const ay1 = a.top;
  const ax2 = a.right;
  const ay2 = a.bottom;
  const bx1 = b.left;
  const by1 = b.top;
  const bx2 = b.right;
  const by2 = b.bottom;

  if (bx1 > ax2 || bx2 < ax1 || by1 > ay2 || by2 < ay1) {
    return new DOMRect();
  }

  const x1 = max(ax1, bx1);
  const y1 = max(ay1, by1);
  const x2 = min(ax2, bx2);
  const y2 = min(ay2, by2);

  return new DOMRect(x1, y1, x2 - x1, y2 - y1);
}

/**
 * Returns the intersection ratio of two rectangles.
 *
 * The result is the area of the intersection divided by the area of the second rectangle.
 *
 * @group Other
 */
export function getIntersectionRatio(a: DOMRect, b: DOMRect): number {
  const ax1 = a.left;
  const ay1 = a.top;
  const ax2 = a.right;
  const ay2 = a.bottom;
  const bx1 = b.left;
  const by1 = b.top;
  const bx2 = b.right;
  const by2 = b.bottom;

  if (ax1 === ax2 || ay1 === ay2 || bx1 === bx2 || by1 === by2 || bx1 > ax2 || bx2 < ax1 || by1 > ay2 || by2 < ay1) {
    return 0;
  }

  return ((min(ax2, bx2) - max(ax1, bx1)) * (min(ay2, by2) - max(ay1, by1))) / ((bx2 - bx1) * (by2 - by1));
}

/**
 * Returns a rectangle that bounds the visual viewport of the window.
 *
 * @group Other
 */
export function getViewportRect(): DOMRect {
  const visualViewport = window.visualViewport || null;

  if (visualViewport === null) {
    return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
  }

  return new DOMRect(visualViewport.offsetLeft, visualViewport.offsetTop, visualViewport.width, visualViewport.height);
}
