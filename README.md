# react-hooks [![build](https://github.com/smikhalevski/react-hooks/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/react-hooks/actions/workflows/master.yml)

The set of opinionated general-purpose React hooks.

```sh
npm install --save-prod @smikhalevski/react-hooks
```

⚠️ [API documentation is available here.](https://smikhalevski.github.io/react-hooks/)

### `useCheckpoint`

Allows extracting conditional logic from event handlers and callbacks.

<details>
<summary>Usage example</summary>

```tsx
import {FC, MouseEvent} from 'react';
import {useCheckpoint} from '@smikhalevski/react-hooks';

// The delete button that requires user to be logged in.
const DeleteButton: FC = () => {

  // The event handler that must be called only if user is logged in.
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

</details>

### `useBlocker`

Blocks UI from the async context. For example, open a popup from async context by locking and close it by unlocking.

<details>
<summary>Usage example</summary>

```tsx
import {FC} from 'react';
import {useBlocker} from '@smikhalevski/react-hooks';

const DeleteButton: FC = () => {

  const blocker = useBlocker<boolean>();

  const handleDelete = async () => {
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

</details>

### `useDebounce`

The replacement for `setTimeout` that is cancelled when component is unmounted.

### `useExecution`

Executes a callback when dependencies are changed and returns
an [`IExecution`](https://smikhalevski.github.io/react-hooks/interfaces/iexecution.html).

### `useExecutor`

Creates a new [`IExecutor`](https://smikhalevski.github.io/react-hooks/interfaces/iexecutor.html).

<details>
<summary>Usage example</summary>

```tsx
import {FC} from 'react';
import {useExecutor} from '@smikhalevski/react-hooks';

const DeleteButton: FC = () => {

  const executor = useExecutor();

  const handleDelete = () => {
    executor.execute(async () => {
      // Execute deletion login here.
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

</details>

### `useMountSignal`

Returns `AbortSignal` that is aborted when the component is unmounted.

### `useRefCallback`

Returns a ref object and a callback to update the value of this ref.

### `useRenderEffect`

Analogue of `React.useEffect` that invokes an `effect` synchronously during rendering if `deps` aren't defined or don't
equal to deps provided during the previous render. This hook comes handy when you need to call an effect during SSR.

### `useRerender`

Returns a callback that triggers a component re-render.

Re-render callback can be safely invoked at any time of the component life cycle. By default, if a component is being
rendered at the time of re-render callback invocation then re-render is ignored. If `force` is set to `true` then
re-render is deferred and triggered after current render completes.

Returned callback doesn't change between hook invocations.

Using this hook makes you code imperative, which is a bad practice in most cases.

### `useSemanticCallback`

A semantic guarantee drop-in replacement for `React.useCallback`. It guarantees that the callback won't be "forgotten"
until the hook is unmounted.

### `useSemanticMemo`

A semantic guarantee drop-in replacement for `React.useMemo`. It guarantees that the value produced by factory won't
be "forgotten" until the hook is unmounted.

### `useToggle`

Returns a boolean flag and functions to toggle its value.
