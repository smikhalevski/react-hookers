import { PubSub } from 'parallel-universe';
import React, { DOMAttributes, EffectCallback, type FocusEventHandler, useLayoutEffect, useState } from 'react';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { getFocusedElement, isFocusable, isPortalEvent } from '../utils/dom.js';
import { emptyArray, emptyObject } from '../utils/lang.js';
import { focusRing } from './focusRing.js';

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
 * Options for the {@link requestFocus} function.
 *
 * @group Behaviors
 */
export interface RequestFocusOptions {
  /**
   * If `true`, no scrolling will occur after the element receives focus. Otherwise, the browser scrolls the document
   * to bring the newly focused element into view.
   *
   * @default false
   */
  isScrollPrevented?: boolean;
}

/**
 * Tries to focus an element.
 *
 * @param element An element to focus.
 * @param options Focus options.
 * @returns `true` if the element is focused.
 * @group Behaviors
 */
export function requestFocus(element: Element | null, options?: RequestFocusOptions): boolean {
  if (element === null || !isFocusable(element)) {
    return false;
  }

  element.focus(options === undefined ? undefined : { preventScroll: options.isScrollPrevented });

  return getFocusedElement() === element;
}

/**
 * A value returned from the {@link useFocus} hook.
 *
 * @group Behaviors
 */
export interface FocusValue {
  /**
   * Props for the element for which focus is tracked.
   *
   * An object whose identity never changes between renders.
   */
  focusProps: DOMAttributes<HTMLElement>;

  /**
   * `true` if the element is currently focused.
   */
  isFocused: boolean;

  /**
   * `true` if the element is currently focused and focus should be visible.
   */
  isFocusVisible: boolean;
}

/**
 * Props for the {@link useFocus} hook.
 *
 * @group Behaviors
 */
export interface FocusProps {
  /**
   * If `true`, focus events are disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * A handler that is called when the element receives focus.
   */
  onFocus?: () => void;

  /**
   * A handler that is called when the element receives focus and focus should be visible.
   */
  onFocusVisible?: () => void;

  /**
   * A handler that is called when the element loses focus.
   */
  onBlur?: () => void;

  /**
   * A handler that is called when the element's focus state changes.
   *
   * @param isFocused `true` if the element is focused.
   */
  onFocusChange?: (isFocused: boolean) => void;
}

/**
 * Handles focus events and normalizes them across platforms.
 *
 * @param props Focus props.
 * @returns An object whose identity never changes between renders.
 * @group Behaviors
 */
export function useFocus(props: FocusProps = emptyObject): FocusValue {
  const [status, setStatus] = useState(STATUS_BLURRED);

  const manager = useFunctionOnce(createFocusManager, setStatus);

  manager.props = props;
  manager.value.isFocused =
    (manager.value.isFocusVisible = status === STATUS_FOCUS_VISIBLE) || status === STATUS_FOCUSED;

  useLayoutEffect(manager.onMounted, emptyArray);
  useLayoutEffect(manager.onUpdated);

  return manager.value;
}

const STATUS_BLURRED = 0;
const STATUS_FOCUSED = 1;
const STATUS_FOCUS_VISIBLE = 2;

interface FocusManager {
  props: FocusProps;
  value: FocusValue;
  onMounted: EffectCallback;
  onUpdated: EffectCallback;
}

function createFocusManager(setStatus: (status: number) => void): FocusManager {
  let status = STATUS_BLURRED;

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

  const handleMounted: EffectCallback = () => {
    const unsubscribeFocusRing = focusRing.subscribe(() => {
      const { onFocusVisible } = manager.props;

      if (status === STATUS_BLURRED) {
        return;
      }

      const prevStatus = status;

      status = focusRing.isVisible ? STATUS_FOCUS_VISIBLE : STATUS_FOCUSED;
      setStatus(status);

      if (prevStatus === STATUS_FOCUSED && status === STATUS_FOCUS_VISIBLE) {
        onFocusVisible?.();
      }
    });

    const unsubscribeCancelFocus = cancelFocusPubSub.subscribe(cancel);

    return () => {
      unsubscribeFocusRing();
      unsubscribeCancelFocus();
    };
  };

  const handleUpdated: EffectCallback = () => {
    const { isDisabled, onFocusChange, onBlur } = manager.props;

    if (isDisabled && status !== STATUS_BLURRED) {
      status = STATUS_BLURRED;
      setStatus(status);

      onFocusChange?.(false);
      onBlur?.();
    }
  };

  const handleFocus: FocusEventHandler = event => {
    const { isDisabled, onFocusChange, onFocus, onFocusVisible } = manager.props;

    if (
      isDisabled ||
      status !== STATUS_BLURRED ||
      (event.type === 'focus' && isPortalEvent(event as React.FocusEvent))
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

  const manager: FocusManager = {
    props: undefined!,
    value: {
      isFocused: false,
      isFocusVisible: false,
      focusProps: {
        onFocus: handleFocus,
        onBlur: cancel,
      },
    },
    onMounted: handleMounted,
    onUpdated: handleUpdated,
  };

  return manager;
}
