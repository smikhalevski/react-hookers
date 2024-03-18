export type Schedule = <A extends any[]>(cb: (...args: A) => void, ms: number, ...args: A) => void;
