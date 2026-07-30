# react-audio-native

## 1.0.0

### Major Changes

- ef51ed4: Introduce the typed React audio player, headless hook, browser compatibility lab and polished Demo.
  WebView host bridges can be detached without receiving later source or state events.
  Package publication is pinned to the official npm registry.

### Patch Changes

- 291732b: Publish a complete npm API and callback Events reference, including prop defaults, snapshot states,
  structured errors, imperative command behavior, pre-ref Hook behavior, composition points, and
  Bridge events.
- cd17cbe: Align the React adapter with the exact published `@trsoliu/audio-core` 1.0 line so it ships the same
  finite-number state handling and stable shared contract as the Vue adapter.

## 1.0.0-beta.2

### Patch Changes

- 291732b: Publish a complete npm API and callback Events reference, including prop defaults, snapshot states,
  structured errors, imperative command behavior, pre-ref Hook behavior, composition points, and
  Bridge events.
- cd17cbe: Consume the exact public `@trsoliu/audio-core@1.0.0-beta.2` prerelease so the React adapter ships
  with the same patched finite-number state handling as the Vue adapter.
