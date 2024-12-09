import { EffectCallback, useLayoutEffect } from 'react';
import { useFunctionOnce } from '../useFunctionOnce';
import { emptyObject, noop } from '../utils/lang';

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

  const container = document.documentElement;
  const { paddingRight, overflow } = container.style;

  container.style.paddingRight = window.innerWidth - container.clientWidth + 'px';
  container.style.overflow = 'hidden';

  container.scrollTo(window.scrollX, window.scrollY);

  enableScroll = () => {
    if (--disableCount !== 0) {
      return;
    }

    const { scrollLeft, scrollTop } = container;

    container.style.paddingRight = paddingRight;
    container.style.overflow = overflow;

    window.scrollTo(scrollLeft, scrollTop);
  };

  return enableScroll;
}
