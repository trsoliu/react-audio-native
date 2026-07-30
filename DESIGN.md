# Design boundaries

- `@trsoliu/audio-core` owns media state, source fallback, playlists, Media Session, exclusivity and
  host Bridge events.
- `react-audio-native` owns React lifecycle integration, callbacks, accessible controls and styling.
- shadcn/ui and Radix are Demo-only dependencies and cannot enter the npm package.
- The public package is browser-first and SSR-import safe; it does not create an audio element until
  a callback ref receives a real `HTMLAudioElement`.
- React Native SDKs, recording, DRM, transcoding and bundled HLS engines are outside 1.0.
- Stable publication accepts either complete device evidence or an exact-version maintainer
  assessment; neither path may bypass the automated release gates.
