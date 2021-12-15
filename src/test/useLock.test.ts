import {renderHook} from '@testing-library/react-hooks/native';
import {useLock} from '../main/useLock';
import {Lock} from '../main/Lock';

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
