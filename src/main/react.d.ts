import 'react';

declare module 'react' {
  interface DOMAttributes<T> {
    [key: `data-${string}`]: string | number | boolean | undefined;
  }
}
