import { EffectCallback, useLayoutEffect } from 'react';
import { useFunctionOnce } from '../useFunctionOnce.js';
import { emptyObject, noop } from '../utils/lang.js';

/**
 * Props of the {@link usePreventScroll} hook.
 *
 * @group Behaviors
 */
export interface PreventScrollProps {
  /**
   * If `true` then scroll isn't prevented.
   *
   * @default false
   */
  isDisabled?: boolean;
}

/**
 * Prevents window scroll.
 *
 * @param props Prevent scroll props.
 * @group Behaviors
 */
export function usePreventScroll(props: PreventScrollProps = emptyObject): void {
  const manager = useFunctionOnce(createPreventScrollManager);

  manager.props = props;

  useLayoutEffect(manager.onDisabledUpdated, [props.isDisabled]);
}

interface PreventScrollManager {
  props: PreventScrollProps;
  onDisabledUpdated: EffectCallback;
}

function createPreventScrollManager(): PreventScrollManager {
  const handleDisableUpdated: EffectCallback = () => {
    if (!manager.props.isDisabled) {
      return disableScroll();
    }
  };

  const manager: PreventScrollManager = {
    props: undefined!,
    onDisabledUpdated: handleDisableUpdated,
  };

  return manager;
}

let disableCount = 0;
let enableScroll = noop;

function disableScroll(): () => void {
  if (disableCount++ !== 0) {
    return enableScroll;
  }

  const body = document.body;
  const { paddingRight, overflow } = body.style;
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

  // Compensate scrollbar width
  body.style.paddingRight = parseInt(window.getComputedStyle(body).paddingRight, 10) + scrollBarWidth + 'px';
  body.style.overflow = 'hidden';

  enableScroll = () => {
    if (--disableCount !== 0) {
      return;
    }

    enableScroll = noop;

    body.style.paddingRight = paddingRight;
    body.style.overflow = overflow;
  };

  return enableScroll;
}
