import { PubSub } from 'parallel-universe';
import React, { DOMAttributes, EffectCallback, RefObject, useLayoutEffect, useState } from 'react';
import { focusRing } from './focusRing';
import { useFunction } from '../useFunction';
import { emptyArray, emptyObject } from '../utils/lang';
import { getFocusedElement, isFocusable, isPortalEvent } from '../utils/dom';

const REQUEST_FOCUS_EVENT = 'requestfocus';

const cancelFocusPubSub = new PubSub();

/**
 * Blurs the currently focused element.
 *
 * @see {@link useFocus}
 * @group Behaviors
 */
export function cancelFocus(): void {
  focusRing.conceal();
  getFocusedElement()?.blur();
  cancelFocusPubSub.publish();
}

/**
 * Options of the {@link requestFocus} function.
 *
 * @group Behaviors
 */
export interface RequestFocusOptions {
  /**
   * If `true` no scrolling will occur after element receives focus, otherwise the browser scrolls the document to bring
   * the newly-focused element into view.
   *
   * @default false
   */
  isScrollPrevented?: boolean;
}

/**
 * Tries to focus an {@link element}.
 *
 * @param element An element to focus.
 * @param options Focus options.
 * @returns `true` if an element is focused.
 * @group Behaviors
 */
export function requestFocus(element: Element | null, options?: RequestFocusOptions): boolean {
  if (element === null || !isFocusable(element)) {
    return false;
  }

  element.focus(options === undefined ? undefined : { preventScroll: options.isScrollPrevented });

  if (getFocusedElement() !== element) {
    // Cannot focus the requested element
    return false;
  }

  element.dispatchEvent(new CustomEvent(REQUEST_FOCUS_EVENT, { bubbles: true }));
  return true;
}

/**
 * A value returned from the {@link useFocus} hook.
 *
 * @group Behaviors
 */
export interface FocusValue {
  /**
   * Props of an element for which focus is tracked.
   *
   * An object which identity never changes between renders.
   */
  focusProps: DOMAttributes<HTMLElement>;

  /**
   * `true` if an element is currently focused.
   */
  isFocused: boolean;

  /**
   * `true` if an element is currently focused and focus should be visible.
   */
  isFocusVisible: boolean;
}

/**
 * Props of the {@link useFocus} hook.
 *
 * @group Behaviors
 */
export interface FocusProps {
  /**
   * If `true` then focus events are disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * A handler that is called when the element receives focus.
   */
  onFocus?: () => void;

  /**
   * A handler that is called when the element receives focus that must be visible to a user.
   */
  onFocusVisible?: () => void;

  /**
   * A handler that is called when the element loses focus.
   */
  onBlur?: () => void;

  /**
   * A handler that is called when the element's focus status changes.
   *
   * @param isFocused `true` if an element is focused.
   */
  onFocusChange?: (isFocused: boolean) => void;
}

/**
 * Handles focus events and normalizes them across platforms.
 *
 * @param ref A reference to a focusable element. This must be the same element to which {@link FocusValue.focusProps}
 * are attached.
 * @param props Focus props.
 * @returns An object which identity never changes between renders.
 * @group Behaviors
 */
export function useFocus(ref: RefObject<Element>, props: FocusProps = emptyObject): FocusValue {
  const [status, setStatus] = useState(STATUS_BLURRED);

  const manager = useFunction(createFocusManager, setStatus);

  manager.ref = ref;
  manager.props = props;
  manager.value.isFocused =
    (manager.value.isFocusVisible = status === STATUS_FOCUS_VISIBLE) || status === STATUS_FOCUSED;

  useLayoutEffect(manager.onMount, emptyArray);
  useLayoutEffect(manager.onUpdate);

  return manager.value;
}

const STATUS_BLURRED = 0;
const STATUS_FOCUSED = 1;
const STATUS_FOCUS_VISIBLE = 2;

interface FocusManager {
  ref: RefObject<Element>;
  props: FocusProps;
  value: FocusValue;
  onMount: EffectCallback;
  onUpdate: EffectCallback;
}

function createFocusManager(setStatus: (status: number) => void): FocusManager {
  let status = STATUS_BLURRED;

  const handleMount: EffectCallback = () => {
    const unsubscribeFocusRing = focusRing.subscribe(() => {
      const { onFocusVisible } = manager.props;

      if (status === STATUS_BLURRED) {
        return;
      }

      const prevFocusStatus = status;

      status = focusRing.isVisible ? STATUS_FOCUS_VISIBLE : STATUS_FOCUSED;
      setStatus(status);

      if (prevFocusStatus === STATUS_FOCUSED && status === STATUS_FOCUS_VISIBLE) {
        onFocusVisible?.();
      }
    });

    const unsubscribeCancelFocus = cancelFocusPubSub.subscribe(cancel);

    window.addEventListener(REQUEST_FOCUS_EVENT, handleRequestFocus, true);

    return () => {
      unsubscribeFocusRing();
      unsubscribeCancelFocus();

      window.removeEventListener(REQUEST_FOCUS_EVENT, handleRequestFocus, true);
    };
  };

  const handleUpdate: EffectCallback = () => {
    const { isDisabled, onFocusChange, onBlur } = manager.props;

    if (isDisabled && status !== STATUS_BLURRED) {
      status = STATUS_BLURRED;
      setStatus(status);

      onFocusChange?.(false);
      onBlur?.();
    }
  };

  const handleRequestFocus = (event: React.FocusEvent | Event) => {
    const { isDisabled, onFocusChange, onFocus, onFocusVisible } = manager.props;

    if (
      isDisabled ||
      status !== STATUS_BLURRED ||
      (event.type === 'focus' && isPortalEvent(event as React.FocusEvent)) ||
      (event.type === REQUEST_FOCUS_EVENT && event.target !== manager.ref.current)
    ) {
      return;
    }

    status = focusRing.isVisible ? STATUS_FOCUS_VISIBLE : STATUS_FOCUSED;
    setStatus(status);

    onFocusChange?.(true);
    onFocus?.();

    if (status === STATUS_FOCUS_VISIBLE) {
      onFocusVisible?.();
    }
  };

  const cancel = (): void => {
    const { isDisabled, onFocusChange, onBlur } = manager.props;

    if (isDisabled || status === STATUS_BLURRED) {
      return;
    }

    status = STATUS_BLURRED;
    setStatus(status);

    onFocusChange?.(false);
    onBlur?.();
  };

  const manager: FocusManager = {
    ref: undefined!,
    props: undefined!,
    value: {
      isFocused: false,
      isFocusVisible: false,
      focusProps: {
        onFocus: handleRequestFocus,
        onBlur: cancel,
      },
    },
    onMount: handleMount,
    onUpdate: handleUpdate,
  };

  return manager;
}
