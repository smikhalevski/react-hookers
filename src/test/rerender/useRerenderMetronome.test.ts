import {renderHook} from '@testing-library/react-hooks/native';
import {useRerenderMetronome} from '../../main';

describe('useRerenderMetronome', () => {

  test('re-renders component after delay', async () => {
    const hook = renderHook(() => useRerenderMetronome(100));
    const timestamp = Date.now();

    await hook.waitForNextUpdate();

    expect(Date.now() - timestamp).toBeGreaterThanOrEqual(100);

    await hook.waitForNextUpdate();

    expect(Date.now() - timestamp).toBeGreaterThanOrEqual(200);

    hook.unmount();
  });
});
