# react-hooks [![build](https://github.com/smikhalevski/react-hooks/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/react-hooks/actions/workflows/master.yml)

The set of opinionated general-purpose React hooks.

```sh
npm install --save-prod @smikhalevski/react-hooks
```

⚠️ [API documentation is available here.](https://smikhalevski.github.io/react-hooks/)

### `useBlocker`

Blocks UI from the async context. For example, open a popup from async context by locking and close it by unlocking.

```tsx
import {FC} from 'react';
import {useBlocker} from '@smikhalevski/react-hooks';

const DeleteButton: FC = () => {

  const blocker = useBlocker<boolean>();

  const handleDelete = async () => {
    if (await blocker.block()) {
      // Proceed with deletion
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

### `useDebounce`

The replacement for `setTimeout` that is cancelled when component is unmounted.

### `useExecution`

Executes a callback when dependencies are changed and returns
an [`IExecution`](https://smikhalevski.github.io/react-hooks/interfaces/iexecution.html).

### `useExecutor`

Creates a new [`IExecutor`](https://smikhalevski.github.io/react-hooks/interfaces/iexecutor.html).

```tsx
import {FC} from 'react';
import {useExecutor} from '@smikhalevski/react-hooks';

const DeleteButton: FC = () => {

  const executor = useExecutor();

  const handleDelete = () => {
    executor.execute(async () => {
      // Do delete request here
      // fetch(…)
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

### `useMountSignal`

Returns `AbortSignal` that is aborted when the component is unmounted.

### `useRefCallback`

Returns a ref object and a callback to update the value of this ref.

### `useRenderEffect`

Analogue of `React.useEffect` that invokes an `_effect` synchronously during rendering if `deps` aren't defined or don't
equal to deps provided during the previous render. This hook comes handy when you need to call an _effect during SSR.

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
