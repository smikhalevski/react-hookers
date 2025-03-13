import { PubSub } from 'parallel-universe';
import { DOMAttributes, EffectCallback, PointerEventHandler, useLayoutEffect, useState } from 'react';
import { useFunctionOnce } from '../useFunctionOnce';
import { isPortalEvent } from '../utils/dom';
import { emptyArray, emptyObject } from '../utils/lang';
import { cursor } from './cursor';

const cancelHoverPubSub = new PubSub();

/**
 * Cancels hover of all currently hovered elements.
 *
 * @see {@link useHover}
 * @see {@link cursor.deactivate}
 * @group Behaviors
 */
export function cancelHover(): void {
  handleHoverUnlocked();
  cancelHoverPubSub.publish();
}

const hoveredElements = new Set<Element>();

/**
 * Returns an array of {@link useHover hovered elements}.
 *
 * @see {@link useHover}
 * @group Behaviors
 */
export function getHoveredElements(): Element[] {
  return Array.from(hoveredElements);
}

/**
 * A value returned from the {@link useHover} hook.
 *
 * @group Behaviors
 */
export interface HoverValue {
  /**
   * Props of an element for which hover interactions are tracked.
   *
   * An object which identity never changes between renders.
   */
  hoverProps: DOMAttributes<Element>;

  /**
   * `true` if an element is currently hovered.
   */
  isHovered: boolean;
}

/**
 * Props of the {@link useHover} hook.
 *
 * @group Behaviors
 */
export interface HoverProps {
  /**
   * If `true` then hover events are disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * A handler that is called when a hover interaction starts.
   */
  onHoverStart?: () => void;

  /**
   * A handler that is called when a hover interaction ends.
   */
  onHoverEnd?: () => void;

  /**
   * A handler that is called when the hover state changes.
   *
   * @param isHovered `true` if an element is hovered.
   */
  onHoverChange?: (isHovered: boolean) => void;
}

/**
 * Handles hover events and normalizes them across platforms.
 *
 * @param props Hover props.
 * @returns An object which identity never changes between renders.
 * @group Behaviors
 */
export function useHover(props: HoverProps = emptyObject): HoverValue {
  const [isHovered, setHovered] = useState(false);

  const manager = useFunctionOnce(createHoverManager, setHovered);

  manager.props = props;
  manager.value.isHovered = isHovered;

  useLayoutEffect(manager.onMounted, emptyArray);
  useLayoutEffect(manager.onUpdated);

  return manager.value;
}

const STATUS_NOT_HOVERED = 0;
const STATUS_HOVERED = 1;
const STATUS_HOVER_DISCARDED = 2;

interface HoverManager {
  props: HoverProps;
  value: HoverValue;
  onMounted: EffectCallback;
  onUpdated: EffectCallback;
}

function createHoverManager(setHovered: (isHovered: boolean) => void): HoverManager {
  let status = STATUS_NOT_HOVERED;
  let element: Element;

  const cancel = (): void => {
    const { onHoverChange, onHoverEnd } = manager.props;

    if (status !== STATUS_HOVERED) {
      status = STATUS_NOT_HOVERED;
      return;
    }

    status = STATUS_NOT_HOVERED;
    setHovered(false);

    hoveredElements.delete(element);

    onHoverChange?.(false);
    onHoverEnd?.();
  };

  const handleMounted: EffectCallback = () => {
    const unsubscribeCancelHover = cancelHoverPubSub.subscribe(cancel);
    const unsubscribeCursor = cursor.subscribe(() => {
      if (!cursor.isActive) {
        // Cancel hover if cursor was deactivated
        cancel();
      }
    });

    if (cancelHoverPubSub.listenerCount === 1) {
      window.addEventListener('blur', cancelHover);
      window.addEventListener('pointerdown', handleHoverLocked, true);
      window.addEventListener('pointerup', handleHoverUnlocked, true);
    }

    return () => {
      unsubscribeCancelHover();
      unsubscribeCursor();

      hoveredElements.delete(element);

      if (cancelHoverPubSub.listenerCount === 0) {
        window.removeEventListener('blur', cancelHover);
        window.removeEventListener('pointerdown', handleHoverLocked, true);
        window.removeEventListener('pointerup', handleHoverUnlocked, true);
      }
    };
  };

  const handleUpdated: EffectCallback = () => {
    if (manager.props.isDisabled) {
      cancel();
    }
  };

  const handlePointerHover: PointerEventHandler = event => {
    const { isDisabled, onHoverChange, onHoverStart } = manager.props;

    if (event.pointerType !== 'mouse' && status === STATUS_NOT_HOVERED) {
      // Disable hover on touchscreens
      // Also fixes iOS Safari https://bugs.webkit.org/show_bug.cgi?id=214609
      status = STATUS_HOVER_DISCARDED;
      return;
    }

    if (event.pointerType === 'mouse' && status === STATUS_HOVER_DISCARDED) {
      status = STATUS_NOT_HOVERED;
      return;
    }

    if (
      isDisabled ||
      status !== STATUS_NOT_HOVERED ||
      event.pointerType !== 'mouse' ||
      !(event.buttons === 0 || event.currentTarget.contains(hoverTarget)) ||
      isPortalEvent(event) ||
      !cursor.isActive
    ) {
      return;
    }

    status = STATUS_HOVERED;
    setHovered(true);

    element = event.currentTarget;
    hoveredElements.add(element);

    onHoverChange?.(true);
    onHoverStart?.();
  };

  const handlePointerLeave: PointerEventHandler = event => {
    if (status !== STATUS_HOVERED || event.pointerType !== 'mouse' || isPortalEvent(event)) {
      return;
    }
    cancel();
  };

  const manager: HoverManager = {
    props: undefined!,
    value: {
      isHovered: false,
      hoverProps: {
        onPointerEnter: handlePointerHover,
        onPointerMove: handlePointerHover,
        onPointerLeave: handlePointerLeave,
      },
    },
    onMounted: handleMounted,
    onUpdated: handleUpdated,
  };

  return manager;
}

/**
 * An element that exclusively captures hover events.
 */
let hoverTarget: Element | null = null;

function handleHoverLocked(event: PointerEvent): void {
  hoverTarget = event.target;
}

function handleHoverUnlocked(): void {
  hoverTarget = null;
}
