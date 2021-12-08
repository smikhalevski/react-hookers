import {useRef} from 'react';
import {useExecutor} from './useExecutor';
import {Executor} from './Executor';

export interface ICheckpoint {
  pending: boolean;

  guard<A extends Array<unknown>>(cb: (...args: A) => void, captureArgs?: (...args: A) => A | void): (...args: A) => void;

  abort(): void;
}

export type CheckpointCondition = (signal: AbortSignal) => unknown;

export type CheckpointFallback = (replay: (force?: boolean) => void) => void;

/**
 * Allows to extract precondition logic from event handlers.
 * @param condition
 * @param fallback
 */
export function useCheckpoint(condition: CheckpointCondition, fallback?: CheckpointFallback): ICheckpoint {
  const manager = useRef<ReturnType<typeof createCheckpointManager>>().current ||= createCheckpointManager();

  manager._update(useExecutor(), condition, fallback);

  return manager._checkpoint;
}

export function createCheckpointManager() {

  let executor: Executor;
  let condition: CheckpointCondition;
  let fallback: CheckpointFallback | undefined;

  const guard: ICheckpoint['guard'] = (cb, captureArgs) => (...args) => {
    const capturedArgs = captureArgs?.(...args) || args;

    executor.execute((signal) => Promise.resolve(condition(signal)).then((ok) => {
      if (signal.aborted) {
        return;
      }
      if (ok) {
        cb(...capturedArgs);
      } else {
        fallback?.(guard(() => cb(...capturedArgs)));
      }
    }));
  };

  const _checkpoint: ICheckpoint = {
    pending: false,
    guard,
    abort: () => executor.abort(),
  };

  Object.defineProperty(_checkpoint, 'pending', {
    get: () => executor.pending,
  });

  const _update = (nextExecutor: Executor, nextCondition: CheckpointCondition, nextFallback?: CheckpointFallback) => {
    executor = nextExecutor;
    condition = nextCondition;
    fallback = nextFallback;
  };

  return {
    _checkpoint,
    _update,
  };
}
