<p align="center">
    <a href="#readme">
      <img alt="React Hookers" width="500" src="./logo.png">
    </a>
</p>

```sh
npm install --save-prod react-hookers
```

🚀 [API documentation is available here.](https://smikhalevski.github.io/react-hookers/)

- [`useAnimationFrame`](#useanimationframe)
- [`useAsyncEffect`](#useasynceffect)
- [`useBlocker`](#useblocker)
- [`useDebouncedState`](#usedebouncedstate)
- [`useHandler`](#usehandler)
- [`useInterval`](#useinterval)
- [`useIntervalCallback`](#useintervalcallback)
- [`useLock`](#uselock)
- [`useMediaQuery`](#usemediaquery)
- [`useRerender`](#usererender)
- [`useRerenderInterval`](#usererenderinterval)
- [`useTimeout`](#usetimeout)

# `useAnimationFrame`

Returns the protocol that starts and stops an animation loop.

When `start` is called the animation loop starts invoking the provided callback using `requestAnimationFrame`. If an
animation is already started then it is stopped and started with the new callback.

An animation is automatically stopped on unmount.

An animation should be started/stopped _after_ the component is mounted. Before that, it is a no-op.

```ts
const [start, stop] = useAnimationFrame();

useEffect(() => {
  // Cancels pending animation loop and schedules the new animation loop
  start(() => {
    // Apply animation changes
  });

  // Stop the animation
  stop();
}, []);
```

# `useAsyncEffect`

Analogue of [`React.useEffect`](https://reactjs.org/docs/hooks-reference.html#useeffect) that can handle a `Promise`
returned from the effect callback. Returned `Promise` may resolve with a destructor / cleanup callback. An effect
callback receives an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) that is aborted
if effect is called again before the previously returned `Promise` is resolved. Cleanup callbacks returned from the
aborted effects are ignored.

```ts
useAsyncEffect(
  async (signal) => {
    doSomething(a, b);

    return () => {
      cleanup();
    };
  },
  [a, b],
);
```

# `useBlocker`

Block an async flow and unblock it from an external context.

```ts
const [isBlocked, block, unblock] = useBlocker<string>();

useEffect(() => {
  // Returns a Promise that is resolved with the value passed to unblock(value)
  block(); // → Promise<string>

  // Unblocks the blocker with given value
  unblock('Hello');
}, []);
```

# `useDebouncedState`

Returns stateful values and a function to update them. Upon invocation of `setState`, the `nextState` is assigned
synchronously, and the component is re-rendered. After the `delay` the `currState` is set to `nextState` and component
is re-rendered again.

```ts
const [currState, nextState, setState] = useDebouncedState(500);
```

# `useHandler`

Returns an always-stable function identity that becomes a no-op after unmount.

```ts
const handleChange = useHandler(props.onChange);
```

# `useInterval`

The replacement for `window.setInterval` that schedules a function to be repeatedly called with a fixed time delay
between each call. Interval is cancelled when component is unmounted or when a new interval is scheduled.

All functions that were scheduled with the same delay are invoked synchronously across all components that use this
hook.

Intervals must be scheduled/canceled after the component is mounted. Before that, it is a no-op.

```ts
const [schedule, cancel] = useInterval();

useEffect(() => {
  // Cancels currently scheduled callback and schedules the new one
  schedule(
    (a, b) => {
      doSomething(a, b);
    },
    500, // Interval delay
    a, b, // Varargs that are passed to the callback
  );

  // Stops invoking the callback that was last provided to schedule()
  cancel();
}, []);
```

# `useIntervalCallback`

Invokes a callback periodically while the component is mounted.

All functions that were scheduled with the same delay are invoked synchronously across all components that use this
hook.

```ts
useIntervalCallback(() => {
  // Runs every 500 ms
}, 500);
```

# `useLock`

Promise-based [lock implementation](https://github.com/smikhalevski/parallel-universe#lock).

When someone tries to acquire a lock using `acquire` they receive a promise for a release callback that is fulfilled
as soon as previous lock owner invokes their release callback. If `acquire` is called after unmount then the returned
promise is never fulfilled.

```ts
const [locked, acquire] = useLock();

async function doSomething() {
  const release = await acquire();
  try {
    // Long process starts here
  } finally {
    release();
  }
}

// Long process would be executed three times sequentially
doSomething();
doSomething();
doSomething();
```

# `useMediaQuery`

Returns `true` if the window
[matches the media query](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia).

```ts
const isMatched = useMediaQuery('(min-width: 600px)');
```

Provide an initial value that is returned during SSR and the initial client render:

```ts
const isMatched = useMediaQuery('(min-width: 600px)', true);
```

# `useRerender`

Returns a callback that triggers a component re-render. Re-render callback can be safely invoked at any time of the
component life cycle. Returned callback doesn't change between hook invocations.

**Note:** Using this hook makes your code imperative, which is generally considered a bad practice.

```ts
const rerender = useRerender();

rerender();
```

# `useRerenderInterval`

Re-renders the component on periodic interval.

All components that use the same interval, are re-rendered synchronously.

```ts
useRerenderInterval(500);
```

# `useTimeout`

Returns the protocol that delays invoking a callback until after a timeout.

The delayed invocation is automatically cancelled on unmount.

The timeout should be started/stopped after the component is mounted. Before that, it is a no-op.

```ts
const [schedule, cancel] = useTimeout();

useEffect(() => {
  // Cancels pending debounce and schedules the new call
  schedule(
    (a, b) => {
      doSomething(a, b);
    },
    500, // Timeout after which the callback is called
    a, b, // Varargs that are passed to the callback
  );

  // Cancels the last debounce call
  cancel();
}, []);
```
