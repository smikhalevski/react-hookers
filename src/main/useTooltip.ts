import { EffectCallback, HTMLAttributes, RefObject, useLayoutEffect } from 'react';
import { focusRing } from './focusRing';
import { mergeProps } from './mergeProps';
import { FocusProps, useFocus } from './useFocus';
import { useFunction } from './useFunction';
import { HoverProps, useHover } from './useHover';
import { useUniqueId } from './useUniqueId';
import { DOMEventHandler } from './types';
import { useCopyObject } from './useCopyObject';
import { emptyArray } from './utils';

/**
 * A value returned from the {@link useTooltip} hook.
 */
export interface HeadlessTooltipValue {
  /**
   * Props of an element that must have a tooltip behaviour.
   *
   * An object which identity never changes between renders.
   */
  tooltipProps: HTMLAttributes<HTMLElement>;

  /**
   * Props of an anchor element that around which a tooltip is positioned.
   */
  anchorProps: HTMLAttributes<HTMLElement>;
}

/**
 * Props of the {@link useTooltip} hook.
 */
export interface HeadlessTooltipProps {
  /**
   * If `true` then a tooltip is visible to a user.
   *
   * @default false
   */
  isOpened?: boolean;

  /**
   * A delay time for the tooltip to show up after a user hovers pointer over an anchor element.
   *
   * @default 1200
   */
  delay?: number;

  /**
   * A delay time for the tooltip to close after a user moved a pointer away from an anchor element.
   *
   * @default 800
   */
  closeDelay?: number;

  /**
   * A handler that is called when a tooltip must be opened: user hover mouse over an anchor, or an anchor was focused
   * via a keyboard.
   */
  onOpen?: () => void;

  /**
   * A handler that is called when a tooltip must be closed.
   */
  onClose?: () => void;

  /**
   * A handler that is called when a tooltip opened state is changed.
   *
   * @param isOpened `true` if tooltip must be visible to a user.
   */
  onOpenChanged?: (isOpened: boolean) => void;
}

/**
 * Provides the behavior and accessibility implementation for a tooltip.
 *
 * @param ref A reference to an anchor element for which tooltip is displayed.
 * @param props Tooltip props.
 * @returns An object which identity never changes between renders.
 */
export function useTooltip(ref: RefObject<Element>, props: HeadlessTooltipProps): HeadlessTooltipValue {
  const manager = useFunction(createTooltipManager);

  const hoverValue = useHover(manager.anchorInteractionProps);
  const focusValue = useFocus(ref, manager.anchorInteractionProps);
  const tooltipId = useUniqueId();

  const { value } = manager;

  value.tooltipProps.id = tooltipId;
  value.anchorProps = useCopyObject(
    useFunction(mergeProps, hoverValue.hoverProps, focusValue.focusProps, manager.anchorProps),
    props.isOpened
  );
  value.anchorProps['aria-describedby'] = props.isOpened ? tooltipId : undefined;

  manager.props = props;

  useLayoutEffect(manager.onMount, emptyArray);
  useLayoutEffect(manager.onOpenUpdate, [props.isOpened]);

  return value;
}

interface TooltipManager {
  anchorInteractionProps: HoverProps & FocusProps;
  anchorProps: HTMLAttributes<HTMLElement>;
  props: HeadlessTooltipProps;
  value: HeadlessTooltipValue;
  close: () => void;
  onMount: EffectCallback;
  onOpenUpdate: EffectCallback;
}

const OPEN_DELAY = 1200;
const CLOSE_DELAY = 800;

let activeManager: TooltipManager | undefined;

function createTooltipManager(): TooltipManager {
  let timer: NodeJS.Timeout;
  let leaveTimestamp = 0;

  const open = () => {
    const { onOpenChanged, onOpen } = manager.props;

    clearTimeout(timer);

    onOpenChanged?.(true);
    onOpen?.();
  };

  const close = () => {
    const { onOpenChanged, onClose } = manager.props;

    clearTimeout(timer);

    onOpenChanged?.(false);
    onClose?.();
  };

  const handleMount: EffectCallback = () => {
    window.addEventListener('keydown', handleEscapeKeyDown);

    return () => window.removeEventListener('keydown', handleEscapeKeyDown);
  };

  const handleOpenUpdate: EffectCallback = () => {
    clearTimeout(timer);

    if (manager.props.isOpened) {
      activeManager?.close();
      activeManager = manager;
      return;
    }

    if (activeManager === manager) {
      activeManager = undefined;
    }
  };

  const handleHoverChange = (isHovered: boolean) => {
    const { isOpened, delay = OPEN_DELAY, closeDelay = CLOSE_DELAY } = manager.props;

    clearTimeout(timer);

    if (!isHovered) {
      leaveTimestamp = Date.now();

      if (isOpened) {
        timer = setTimeout(close, closeDelay);
      }
      return;
    }

    if (isOpened) {
      return;
    }

    if (activeManager !== undefined || Date.now() - leaveTimestamp < delay) {
      open();
    } else {
      timer = setTimeout(open, delay);
    }
  };

  const handleFocusChange = (isFocused: boolean) => {
    const { isOpened } = manager.props;

    if (!isFocused && isOpened) {
      close();
    }
    if (isFocused && !isOpened && focusRing.isVisible) {
      open();
    }
  };

  const handleEscapeKeyDown: DOMEventHandler<KeyboardEvent> = event => {
    if (event.key !== 'Escape' || event.repeat) {
      return;
    }
    close();
  };

  const manager: TooltipManager = {
    anchorInteractionProps: {
      onHoverChange: handleHoverChange,
      onFocusChange: handleFocusChange,
    },
    anchorProps: {
      onPointerDown: close,
    },
    props: undefined!,
    value: {
      tooltipProps: {},
      anchorProps: undefined!,
    },
    close,
    onMount: handleMount,
    onOpenUpdate: handleOpenUpdate,
  };

  return manager;
}
