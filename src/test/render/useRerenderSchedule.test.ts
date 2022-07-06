import { renderHook } from '@testing-library/react-hooks/native';
import { useRerenderSchedule } from '../../main';

describe('useRerenderSchedule', () => {
  test('re-renders component after delay', async () => {
    const hook = renderHook(() => useRerenderSchedule(100));
    const timestamp = Date.now();

    await hook.waitForNextUpdate();

    expect(Date.now() - timestamp).toBeGreaterThanOrEqual(100);

    await hook.waitForNextUpdate();

    expect(Date.now() - timestamp).toBeGreaterThanOrEqual(200);

    hook.unmount();
  });
});
