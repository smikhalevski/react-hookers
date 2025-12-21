/**
 * A handler that can be attached to a DOM element.
 *
 * @template E The event type received by the handler.
 * @group Other
 */
export type DOMEventHandler<E extends Event = Event> = (event: E) => void;

/**
 * An element that can receive focus.
 *
 * @group Other
 */
export type FocusableElement = HTMLElement | SVGElement;

/**
 * Schedules a timed invocation of a callback with the provided arguments.
 *
 * @param cb The callback to invoke.
 * @param ms The delay, in milliseconds, after which the callback is invoked.
 * @param args Arguments passed to the callback.
 * @template A The callback argument types.
 * @group Other
 */
export type Schedule = <A extends any[]>(cb: (...args: A) => void, ms: number, ...args: A) => void;
