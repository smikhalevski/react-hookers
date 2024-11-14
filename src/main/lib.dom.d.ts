// Overrides lib.dom.d.ts to avoid excessive type checks

interface MouseEvent {
  readonly target: HTMLElement | SVGElement;
}

interface KeyboardEvent {
  readonly target: HTMLInputElement;
}

interface PointerEvent {
  readonly target: HTMLElement | SVGElement;
}

interface TouchEvent {
  readonly target: HTMLElement | SVGElement;
}

interface FocusEvent {
  readonly target: HTMLElement | SVGElement;
}

interface WheelEvent {
  readonly target: HTMLElement | SVGElement;
}

interface DragEvent {
  readonly target: HTMLElement | SVGElement;
}
