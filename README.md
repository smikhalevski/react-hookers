# react-hooks [![build](https://github.com/smikhalevski/react-hooks/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/react-hooks/actions/workflows/master.yml)

The set of general-purpose React hooks.

- [`useBlocker`](#useblocker)
- [`useCheckpoint`](#usecheckpoint)
- [`useDebounce`](#usedebounce)
- [`useDebouncedState`](#usedebouncedstate)
- `useEffectOnce`
- [`useRenderEffect`](#userendereffect)
- `useRenderEffectOnce`
- [`useExecution`](#useexecution)
- [`useExecutor`](#useexecutor)
- `useInterval`
- `usePrevState`
- [`useSemanticCallback`](#usesemanticcallback)
- [`useSemanticMemo`](#usesemanticmemo)
- [`useRefCallback`](#userefcallback)
- `useRenderedValueRef`
- [`useRerender`](#usererender)
- `useRerenderInterval`
- `useTime`
- [`useMountSignal`](#usemountsignal)
- [`useToggle`](#usetoggle)

```sh
npm install --save-prod @smikhalevski/react-hooks
```

⚠️ [API documentation is available here.](https://smikhalevski.github.io/react-hooks/)

## `useBlocker`

Blocks UI from the async context. For example, open a popup from async context by blocking and close it by unblocking.

```tsx
import {FC} from 'react';
import {useBlocker} from '@smikhalevski/react-hooks';

const DeleteButton: FC = () => {

  const blocker = useBlocker<boolean>();

  const handleDelete = async () => {

    // This would re-render the component and open a popup.
    if (await blocker.block()) {
      // Proceed with deletion.
    }
  };

  return (
      <>
        <Popup opened={blocker.blocked}>
          {'Are you sure?'}

          <button onClick={() => blocker.unblock(false)}>
            {'No, don\'t delete'}
          </button>

          <button onClick={() => blocker.unblock(true)}>
            {'Yes, delete'}
          </button>
        </Popup>

        <button
            disabled={blocker.blocked}
            onClick={handleDelete}
        >
          {'Delete'}
        </button>
      </>
  );
};
```

## `useCheckpoint`

Allows extracting shared conditional logic from event handlers and callbacks.

```tsx
import {FC, MouseEvent} from 'react';
import {useCheckpoint} from '@smikhalevski/react-hooks';

// The delete button that requires the user to be logged in.
const DeleteButton: FC = () => {

  // The event handler that must be called only if the user is logged in.
  const handleClick = (event: MouseEvent): void => {
    // Proceed with deletion.
  };

  // The callback that checks that the user is logged in, can be async.
  const isUserLoggedIn = (): void => {
    return false;
  };

  // The checkpoint fallback logic that should be used if user tried to
  // invoke a handler, but wasn't logged in.
  const handleOpenLoginPopup = (replay: () => void): void => {
    // Open a login popup here. After user was successfully logged in,
    // you can replay user the action that caused the fallback.
  };

  const loginCheckpoint = useCheckpoint(isUserLoggedIn, handleOpenLoginPopup);

  // After the button is clicked, the checkpoint ensures that user is
  // logged in and then invokes the handler or the fallback. 
  return (
      <button onClick={loginCheckpoint.guard(handleClick, (event) => event.persist())}>
        {'Delete'}
      </button>
  );
}
```

## `useDebounce`

The replacement for `setTimeout` that is cancelled when component is unmounted.

```ts
const [debounce, cancel] = useDebounce();

debounce((value) => console.log(value), 500, 'abc');

cancel();
```

## `useDebouncedState`

Returns a stateful values, and a function to update it. Upon invocation of `setState`, the `nextState` is assigned
synchronously and component is re-rendered. After the `delay` the `currState` is set to `nextState` and component is
re-rendered again.

```ts
const [currState, nextState, setState] = useDebouncedState(500);
```

## `useExecution`

Executes a callback when dependencies are changed and returns
an [`IExecution`](https://smikhalevski.github.io/react-hooks/interfaces/iexecution.html).

```tsx
import {FC} from 'react';

const UserDetails: FC<{ userId: string }> = ({userId}) => {

  // Execution would automatically re-fetch the user if userId is changed. 
  const userExecution = useExecution(() => fetch('http://localhost/users/' + userId), [userId]);

  if (userExecution.pending) {
    return <span>{'Loading'}</span>;
  }

  return <span>{userExecution.result?.firstName}</span>;
};
```

## `useExecutor`

Creates a new [`IExecutor`](https://smikhalevski.github.io/react-hooks/interfaces/iexecutor.html).

```tsx
import {FC} from 'react';
import {useExecutor} from '@smikhalevski/react-hooks';

const DeleteButton: FC = () => {

  const executor = useExecutor();

  const handleDelete = () => {
    executor.execute(async (signal) => {
      // Execute deletion login here.
      // Signal would be aborted when component unmounts.
    });
  };

  return (
      <button
          onClick={handleDelete}
          disabled={executor.pending}
      >
        {'Delete'}
      </button>
  );
};
```

You can manage how executors are created with `ExecutorManager`
and [`SsrExecutorManager`](https://smikhalevski.github.io/react-hooks/classes/SsrExecutorManager.html).

```tsx
import {renderToString} from 'react-dom';
import {SsrExecutorManager} from '@smikhalevski/react-hooks';

const mySsrExecutorManager = new SsrExecutorManager();

renderToString(
    <ExecutorManagerContext.Provider value={mySsrExecutorManager}>
      <DeleteButton/>
    </ExecutorManagerContext.Provider>
);

// Waits for all executors to complete pending executions.
await mySsrExecutorManager.waitForExecutorsToComplete();
```

You can create a custom `useExecutor` hook that is bound to a custom context.

```ts
import {createContext} from 'react';
import {createExecutorHook, Executor, ExecutorManager} from '@smikhalevski/react-hooks';

class MyExecutorManager extends ExecutorManager {
  // Your overrides here.
}

const MyExecutorManagerContext = createContext(new MyExecutorManager());

const useMyExecutor = createExecutorHook(MyExecutorManagerContext);
```

## `useMountSignal`

Returns `AbortSignal` that is aborted when the component is unmounted.

## `useRefCallback`

Returns a ref object, and a callback to update the value of this ref.

## `useRenderEffect`

Analogue of `React.useEffect` that invokes an `effect` synchronously during rendering if `deps` aren't defined or don't
equal to deps provided during the previous render. This hook comes handy when you need to call an effect during SSR.

## `useRerender`

Returns a callback that triggers a component re-render. Re-render callback can be safely invoked at any time of the
component life cycle. Returned callback doesn't change between hook invocations.

**Note:** Using this hook makes you code imperative, which is generally considered a bad practice.

## `useSemanticCallback`

A semantic guarantee drop-in replacement for `React.useCallback`. It guarantees that the callback won't be "forgotten"
until the hook is unmounted.

## `useSemanticMemo`

A semantic guarantee drop-in replacement for `React.useMemo`. It guarantees that the value produced by factory won't
be "forgotten" until the hook is unmounted.

## `useToggle`

Returns a boolean flag and functions to toggle its value.
