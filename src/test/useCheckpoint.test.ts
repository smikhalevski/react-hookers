import {renderHook} from '@testing-library/react-hooks/native';
import {useCheckpoint} from '../main';
import {MouseEvent} from 'react';

describe('useCheckpoint', () => {

  test('not pending by default', () => {
    const hook = renderHook(() => useCheckpoint(() => true));

    expect(hook.result.current.pending).toBe(false);
  });

  test('not pending by default', () => {

    const loginCheckpoint = useCheckpoint(() => true);

    loginCheckpoint.guard((event: MouseEvent) => 123, (event) => event.persist())

  });
});
