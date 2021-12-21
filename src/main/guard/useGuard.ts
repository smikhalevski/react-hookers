import {useRef} from 'react';
import {useExecutor} from '../executor';
import {Guard, GuardCondition, GuardFallback} from './Guard';

/**
 * Allows extracting shared conditional logic from event handlers and callbacks.
 *
 * @param condition The condition that should be met.
 * @param fallback The callback that is invoked if condition wasn't met.
 */
export function useGuard(condition: GuardCondition, fallback?: GuardFallback): Guard {
  const executor = useExecutor();
  const guard = useRef<Guard>().current ||= new Guard(executor, condition, fallback);

  guard.executor = executor;
  guard.condition = condition;
  guard.fallback = fallback;

  return guard;
}
