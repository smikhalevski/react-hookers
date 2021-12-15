import {renderHook} from '@testing-library/react-hooks/native';
import {Lock, useLock} from '../../main';

describe('useLock', () => {

  test('returns the same Lock on every render', () => {
    const hook = renderHook(() => useLock());
    const lock1 = hook.result.current;

    expect(lock1).toBeInstanceOf(Lock);

    hook.rerender();
    const lock2 = hook.result.current;

    expect(lock1).toBe(lock2);
  });
});
