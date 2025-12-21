import { EffectCallback, HTMLAttributes, useEffect, useId } from 'react';
import { focusRing } from '../behaviors/focusRing.js';
import { FocusProps, useFocus } from '../behaviors/useFocus.js';
import { HoverProps, useHover } from '../behaviors/useHover.js';
import { DOMEventHandler } from '../types.js';
import { useFunction } from '../useFunction.js';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { emptyArray } from '../utils/lang.js';
import { mergeProps } from '../utils/mergeProps.js';

/**
 * A value returned from the {@link useTooltip} hook.
 *
 * @group Components
 */
export interface HeadlessTooltipValue {
  /**
   * Props for the element that implements tooltip behavior.
   *
   * The object identity never changes between renders.
   */
  tooltipProps: HTMLAttributes<HTMLElement>;

  /**
   * Props for the anchor element around which the tooltip is positioned.
   */
  anchorProps: HTMLAttributes<HTMLElement>;
}

/**
 * Props for the {@link useTooltip} hook.
 *
 * @group Components
 */
export interface HeadlessTooltipProps {
  /**
   * If `true`, the tooltip is visible to the user.
   *
   * @default false
   */
  isOpened?: boolean;

  /**
   * The delay, in milliseconds, before the tooltip is shown after the user hovers over the anchor element.
   *
   * @default 1200
   */
  delay?: number;

  /**
   * The delay, in milliseconds, before the tooltip is closed after the user moves the pointer away from
   * the anchor element.
   *
   * @default 800
   */
  closeDelay?: number;

  /**
   * A callback invoked when the tooltip should be opened, such as when the user hovers over the anchor element
   * or focuses it via the keyboard.
   */
  onOpen?: () => void;

  /**
   * A callback invoked when the tooltip should be closed.
   */
  onClose?: () => void;

  /**
   * A callback invoked when the tooltip open state changes.
   *
   * @param isOpened `true` if the tooltip should be visible.
   */
  onOpenChanged?: (isOpened: boolean) => void;
}

/**
 * Provides behavior and accessibility for a tooltip component.
 *
 * @param props Tooltip props.
 * @returns An object whose identity never changes between renders.
 * @group Components
 */
export function useTooltip(props: HeadlessTooltipProps): HeadlessTooltipValue {
  const manager = useFunctionOnce(createTooltipManager);

  const hoverValue = useHover(manager.anchorInteractionProps);
  const focusValue = useFocus(manager.anchorInteractionProps);
  const tooltipId = useId();

  const { value } = manager;

  const anchorProps = useFunction(mergeProps, hoverValue.hoverProps, focusValue.focusProps, manager.anchorProps);

  value.tooltipProps.id = tooltipId;
  value.anchorProps = useFunction((anchorProps, _) => ({ ...anchorProps }), anchorProps, props.isOpened);

  value.anchorProps['aria-describedby'] = props.isOpened ? tooltipId : undefined;

  manager.props = props;

  useEffect(manager.onMounted, emptyArray);
  useEffect(manager.onOpenedUpdated, [props.isOpened]);

  return value;
}

interface TooltipManager {
  anchorInteractionProps: HoverProps & FocusProps;
  anchorProps: HTMLAttributes<HTMLElement>;
  props: HeadlessTooltipProps;
  value: HeadlessTooltipValue;
  close: () => void;
  onMounted: EffectCallback;
  onOpenedUpdated: EffectCallback;
}

const OPEN_DELAY = 1200;
const CLOSE_DELAY = 800;

let activeManager: TooltipManager | undefined;

function createTooltipManager(): TooltipManager {
  let timer: number;
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

  const handleMounted: EffectCallback = () => {
    window.addEventListener('keydown', handleEscapeKeyDown);

    return () => window.removeEventListener('keydown', handleEscapeKeyDown);
  };

  const handleOpenedUpdated: EffectCallback = () => {
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
    onMounted: handleMounted,
    onOpenedUpdated: handleOpenedUpdated,
  };

  return manager;
}
