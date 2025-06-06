/**
 * A handler that can be attached to a DOM element.
 *
 * @template E An event received by a handler.
 * @group Other
 */
export type DOMEventHandler<E extends Event = Event> = (event: E) => void;

/**
 * An element that can receive focus.
 * @group Other
 */
export type FocusableElement = HTMLElement | SVGElement;

/**
 * Schedules a timed invocation of the callback with provided arguments.
 *
 * @param cb The callback to invoke.
 * @param ms The delay after which the callback must be invoked.
 * @param args Varargs that are passed as arguments to the callback.
 * @template A The callback arguments.
 * @group Other
 */
export type Schedule = <A extends any[]>(cb: (...args: A) => void, ms: number, ...args: A) => void;
