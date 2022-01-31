# react-hooks 🪝 [![build](https://github.com/smikhalevski/react-hooks/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/react-hooks/actions/workflows/master.yml)

The set of general-purpose React hooks.

```sh
npm install --save-prod @smikhalevski/react-hooks
```

📚 [API documentation is available here.](https://smikhalevski.github.io/react-hooks/)

**State**

- [`usePrevState`](#useprevstate)
- [`useRefCallback`](#userefcallback)
- [`useRenderedValueRef`](#userenderedvalueref)
- [`useSemanticCallback`](#usesemanticcallback)
- [`useSemanticMemo`](#usesemanticmemo)
- [`useExecution`](#useexecution)
- [`useExecutor`](#useexecutor)
- [`useToggle`](#usetoggle)

**Side effects**

- [`useAsyncEffect`](#useasynceffect)
- [`useAsyncEffectOnce`](#useasynceffectonce)
- [`useEffectOnce`](#useeffectonce)
- [`useIsomorphicLayoutEffect`](#useisomorphiclayouteffect)
- [`useRenderEffect`](#userendereffect)
- [`useRenderEffectOnce`](#userendereffectonce)

**Rendering**

- [`useRerender`](#usererender)
- [`useMountSignal`](#usemountsignal)
- [`useRerenderSchedule`](#usererenderschedule)

**Time**

- [`useTime`](#usetime)
- [`useAnimationFrame`](#useanimationframe)
- [`useMetronome`](#usemetronome)
- [`useSchedule`](#useschedule)
- [`useDebounce`](#usedebounce)
- [`useDebouncedState`](#usedebouncedstate)

**User flow**

- [`useBlocker`](#useblocker)
- [`useGuard`](#useguard)

# State

### `usePrevState`

Compares the state passed during the previous render with the newly given state, and if they differ based on equality
checker, then the new state is returned.

```ts
const nextValue = usePrevState(
    value,
    (prevValue, value) => prevValue !== value,
);
```

### `useRefCallback`

Returns a ref object and a callback to update the value of this ref.

```ts
const [ref, updateRef] = useRefCallback(initialValue);
```

### `useRenderedValueRef`

Creates a `MutableRefObject` that keeps ref to the given value. This hook comes in handy if you want to use the props
provided during the most recent render in the async context.

```ts
const valueRef = useRenderedValueRef(value);
```

### `useSemanticCallback`

The drop-in replacement for `React.useCallback` which provides the semantic guarantee that the callback won't be "
forgotten" until the hook is unmounted.

```ts
const memoizedCallback = useSemanticCallback(
    () => doSomething(a, b),
    [a, b],
);
```

### `useSemanticMemo`

The drop-in replacement for `React.useMemo` which provides thee semantic guarantee that the value produced by factory
won't be "forgotten" until the hook is unmounted.

```ts
const memoizedValue = useSemanticMemo(
    () => computeExpensiveValue(a, b),
    [a, b],
);
```

### `useExecution`

Executes a callback when dependencies are changed and returns an
[`Executor`](https://smikhalevski.github.io/react-hooks/classes/executor.html) instance that describes the result and
status.

```tsx
const executor = useExecution(
    async (signal) => doSomething(a, b),
    [a, b],
);
```

### `useExecutor`

Creates a new [`Executor`](https://smikhalevski.github.io/react-hooks/interfaces/executor.html) instance that provides
means to call, abort and monitor async callbacks.

```tsx
const executor = useExecutor(initialValue);

// Starts a new execution.
// If there's pending execution, it is aborted via signal.
executor.execute(async (signal) => doSomething());
```

You can manage how executors are created with `ExecutorProvider` and
[`SsrExecutorProvider`](https://smikhalevski.github.io/react-hooks/classes/SsrExecutorManager.html).

```tsx
import {renderToString} from 'react-dom';
import {SsrExecutorProvider, ExecutorProviderContext} from '@smikhalevski/react-hooks';

const mySsrExecutorProvider = new SsrExecutorProvider();

renderToString(
    <ExecutorProviderContext.Provider value={mySsrExecutorProvider}>
      {/* */}
    </ExecutorProviderContext.Provider>
);

// Waits for all executors to complete pending executions
await mySsrExecutorProvider.waitForExecutorsToComplete();
```

You can create a custom `useExecutor` hook that is bound to a custom context.

```ts
import {createContext} from 'react';
import {createExecutorHook, ExecutorProvider} from '@smikhalevski/react-hooks';

const MyExecutorProviderContext = createContext(new ExecutorProvider());

const useMyExecutor = createExecutorHook(MyExecutorProviderContext);
```

### `useToggle`

Returns a boolean flag and functions to toggle its value.

```ts
const [enabled, enable, disable] = useToggle(initialValue);
```

# Side effects

### `useAsyncEffect`

Analogue of `React.useEffect` that can handle a `Promise` returned from the effect callback. Returned `Promise` may
resolve with a destructor / cleanup callback. An effect callback receives an
[`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) that is aborted if effect is called
again before the previously returned `Promise` is resolved.

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

### `useAsyncEffectOnce`

Same as [`useAsyncEffect`](#useasynceffect) but calls effect only once after the component is mounted.

The optional cleanup callback is called when the component is unmounted.

```ts
useAsyncEffectOnce(async (signal) => {
  doSomething(a, b);

  return () => {
    cleanup();
  };
});
```

### `useEffectOnce`

Same as `React.useEffect` but calls effect only once after the component is mounted.

The optional cleanup callback is called when the component is unmounted.

```ts
useEffectOnce(() => {
  doSomething(a, b);

  return () => {
    cleanup();
  };
});
```

### `useIsomorphicLayoutEffect`

Same as `React.useLayoutEffect` but doesn't produce warnings during SSR.

```ts
useIsomorphicLayoutEffect(
    () => {
      doSomething(a, b);

      return () => {
        cleanup();
      };
    },
    [a, b],
);
```

### `useRenderEffect`

Analogue of `React.useEffect` that invokes an `effect` synchronously during rendering if `deps` aren't defined or don't
equal to deps provided during the previous render. This hook comes in handy when calling an effect during SSR.

The optional cleanup callback is called synchronously during rendering.

```ts
useRenderEffect(
    () => {
      doSomething(a, b);

      return () => {
        cleanup();
      };
    },
    [a, b],
);
```

### `useRenderEffectOnce`

Same as [`useRenderEffect`](#userendereffect) but calls effect only once after the component is mounted.

The optional cleanup callback is called when the component is unmounted.

```ts
useRenderEffectOnce(() => {
  doSomething(a, b);

  return () => {
    cleanup();
  };
});
```

# Rendering

### `useRerender`

Returns a callback that triggers a component re-render. Re-render callback can be safely invoked at any time of the
component life cycle. Returned callback doesn't change between hook invocations.

**Note:** Using this hook makes your code imperative, which is generally considered a bad practice.

```ts
const rerender = useRerender();

rerender();
```

### `useMountSignal`

Returns `AbortSignal` that is aborted when the component is unmounted.

```ts
const signal = useMountSignal();

// Returns true if componenet was unmounted
signal.aborted;
```

### `useRerenderSchedule`

Re-renders the component on periodic interval.

```ts
useRerenderSchedule(500);
```

# Time

### `useTime`

Returns the [`Time`](https://smikhalevski.github.io/react-hooks/classes/Time.html) instance that provides the current
timestamp.

```ts
const time = useTime();

// Use this instead of Date.now()
time.now();
```

You can alter the timestamp by providing the custom
[`Time`](https://smikhalevski.github.io/react-hooks/classes/Time.html) implementation.

```tsx
import {renderToString} from 'react-dom';
import {Time, TimeContext} from '@smikhalevski/react-hooks';

const myTime = new Time();

// After this, myTime.now() would return the timestamp
// that is 1 munute ahead of the Date.now()
myTime.setTimestamp(Date.now() + 60_000);

renderToString(
    <TimeContext.Provider value={myTime}>
      {/* */}
    </TimeContext.Provider>
);
```

### `useAnimationFrame`

Returns protocol to start and stop an animation loop.

When `start` is called the animation loop starts invoking the provided callback using `requestAnimationFrame`. If the
animation was already pending then it is stopped and started with the new callback.

```ts
const [start, stop] = useAnimationFrame();

// Cancels pending animation loop and schedules the new animation loop
start(() => {
  // Apply animation changes
});

// Stop the animation
stop();
```

### `useMetronome`

Returns a [`Metronome`](https://smikhalevski.github.io/react-hooks/classes/Metronome.html) instance. Use this to
schedule callback invocation.

```ts
const metronome = useMetronome(500);

useEffect(
    () => metronome.schedule(() => {
      // Invoked every 500 ms
      doSomething();
    }),
    [metronome],
);
```

You can alter how metronomes are created by providing the custom
[`MetronomeProvider`](https://smikhalevski.github.io/react-hooks/classes/MetronomeProvider.html) implementation.

```tsx
import {renderToString} from 'react-dom';
import {MetronomeProvider, MetronomeProviderContext} from '@smikhalevski/react-hooks';

const myMetronomeProvider = new MetronomeProvider();

renderToString(
    <MetronomeProviderContext.Provider value={myMetronomeProvider}>
      {/* */}
    </MetronomeProviderContext.Provider>
);
```

### `useSchedule`

The replacement for `setInterval` that is cancelled when component is unmounted. Schedules a function to be repeatedly
called with a fixed time delay between each call.

All functions that were scheduled with the same delay are invoked synchronously.

```ts
const [schedule, cancel] = useSchedule();

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
```

### `useDebounce`

The replacement for `setTimeout` that is cancelled when component is unmounted.

```ts
const [debounce, cancel] = useDebounce();

// Cancels pending debounce and schedules the new call
debounce(
    (a, b) => {
      doSomething(a, b);
    },
    500, // Timeout after which the callback is called
    a, b, // Varargs that are passed to the callback
);

// Cancels the last debounce call
cancel();
```

### `useDebouncedState`

Returns stateful values and a function to update them. Upon invocation of `setState`, the `nextState` is assigned
synchronously, and the component is re-rendered. After the `delay` the `currState` is set to `nextState` and component
is re-rendered again.

```ts
const [currState, nextState, setState] = useDebouncedState(500);
```

# User flow

### `useBlocker`

Provides mechanism for blocking async processes and unblocking them from an external context.

```tsx
const blocker = useBlocker<boolean>();

// Returns Promise that is resolved with the value passed to blocker.unblock(value)
blocker.block(); // → Promise<boolean>

// Unblocks the blocker with given value.
blocker.unblock(true);
```

### `useGuard`

Extract shared conditional logic from event handlers and callbacks.

```tsx
const guard = useGuard(
    async () => checkCondition(),

    async (replay) => {
      // Invoked if the guarded callback was called when condition wasn't met.
      doFallback();

      // Invoke the guarded callback with the same arguments.
      replay();
    },
);

const myGuardedCallback = guard.guardCallback((a, b) => {
  myCallback(a, b);
});

myGuardedCallback(a, b);
```
