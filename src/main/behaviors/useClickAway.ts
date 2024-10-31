import { DOMAttributes, EffectCallback, PointerEventHandler, useLayoutEffect } from 'react';
import { useFunction } from '../useFunction';
import { emptyArray } from '../utils/lang';

/**
 * A value returned from the {@link useClickAway} hook.
 *
 * @group Behaviors
 */
export interface ClickAwayValue {
  /**
   * Props of a container element that can receive clicks without triggering click away.
   *
   * An object which identity never changes between renders.
   */
  containerProps: DOMAttributes<Element>;
}

/**
 * Props of the {@link useClickAway} hook.
 *
 * @group Behaviors
 */
export interface ClickAwayProps {
  /**
   * If `true` then click away listeners are disabled.
   *
   * @default false
   */
  isDisabled?: boolean;

  /**
   * A handler that is called when a user clicks outside a {@link ClickAwayValue.containerProps container}.
   */
  onClickAway?: () => void;
}

/**
 * Calls {@link ClickAwayProps.onClickAway onClickAway} handler if a user clicks outside a container.
 *
 * @param props Click-away props.
 * @returns An object which identity never changes between renders.
 * @group Behaviors
 */
export function useClickAway(props: ClickAwayProps): ClickAwayValue {
  const manager = useFunction(createClickAwayManager);

  manager.props = props;

  useLayoutEffect(manager.onMounted, emptyArray);

  return manager.value;
}

interface ClickAwayManager {
  props: ClickAwayProps;
  value: ClickAwayValue;
  containerPointerEvent: PointerEvent | null;
  onMounted: EffectCallback;
}

function createClickAwayManager() {
  const handleMounted: EffectCallback = () => registerClickAwayManager(manager);

  const handlePointerDown: PointerEventHandler = event => {
    manager.containerPointerEvent = event.nativeEvent;
  };

  const manager: ClickAwayManager = {
    props: undefined!,
    value: {
      containerProps: {
        onPointerDownCapture: handlePointerDown,
      },
    },
    containerPointerEvent: null,
    onMounted: handleMounted,
  };

  return manager;
}

const clickAwayManagers: ClickAwayManager[] = [];

function registerClickAwayManager(manager: ClickAwayManager): () => void {
  if (clickAwayManagers.unshift(manager) === 1) {
    window.addEventListener('pointerdown', handleClickAway);
  }

  return () => {
    clickAwayManagers.splice(clickAwayManagers.indexOf(manager), 1);

    if (clickAwayManagers.length === 0) {
      window.removeEventListener('pointerdown', handleClickAway);
    }
  };
}

function handleClickAway(event: PointerEvent): void {
  if (event.button !== 0) {
    return;
  }

  for (const manager of clickAwayManagers) {
    const { isDisabled, onClickAway } = manager.props;

    if (isDisabled) {
      manager.containerPointerEvent = null;
      continue;
    }

    if (manager.containerPointerEvent !== event) {
      event.preventDefault();
      onClickAway?.();
    }

    manager.containerPointerEvent = null;
    break;
  }
}
