import {useRef} from 'react';
import {useExecutor} from './useExecutor';
import {Checkpoint, CheckpointCondition, CheckpointFallback} from './Checkpoint';

/**
 * Allows extracting conditional logic from event handlers and callbacks.
 *
 * @param condition The condition that should be met.
 * @param fallback The callback that is invoked if condition wasn't met.
 */
export function useCheckpoint(condition: CheckpointCondition, fallback?: CheckpointFallback): Checkpoint {
  const executor = useExecutor();
  const checkpoint = useRef<Checkpoint>().current ||= new Checkpoint(executor, condition, fallback);

  checkpoint.executor = executor;
  checkpoint.condition = condition;
  checkpoint.fallback = fallback;

  return checkpoint;
}
