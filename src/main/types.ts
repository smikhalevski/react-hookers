export type SetTimeout = <A extends any[]>(cb: (...args: A) => void, ms?: number, ...args: A) => void;
