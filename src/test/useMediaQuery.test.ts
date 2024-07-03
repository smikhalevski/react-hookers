import { renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { useMediaQuery } from '../main';

describe('useMediaQuery', () => {
  const mediaQueryList = {
    matches: false,
    media: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(() => mediaQueryList),
  });

  beforeEach(() => {
    mediaQueryList.matches = false;
  });

  test('returns a the current value on the first render', () => {
    const hook1 = renderHook(() => useMediaQuery('(min-width: 600px)'), { wrapper: StrictMode });

    expect(hook1.result.current).toBe(false);

    mediaQueryList.matches = true;

    const hook2 = renderHook(() => useMediaQuery('(min-width: 600px)'), { wrapper: StrictMode });

    expect(hook2.result.current).toBe(true);
  });

  test('returns a the initial value on the first render', () => {
    const hook = renderHook(() => useMediaQuery('(min-width: 600px)', true), { wrapper: StrictMode });

    expect(hook.result.current).toBe(true);
  });

  test('returns a the current value on re-render if initial value was provided', () => {
    const hook = renderHook(() => useMediaQuery('(min-width: 600px)', true), { wrapper: StrictMode });

    hook.rerender();

    expect(hook.result.current).toBe(false);
  });
});
