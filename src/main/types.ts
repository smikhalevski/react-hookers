export type Schedule = <A extends any[]>(cb: (...args: A) => void, ms: number, ...args: A) => void;

export interface ExecutorOptions {
  /**
   * Defines when the executor is initialized:
   *
   * - If `server` then executor is initialized during the initial render;
   * - If `client` then the executor is initialized in the effect callback.
   *
   * @default 'client'
   */
  disposition?: 'server' | 'client';
}
