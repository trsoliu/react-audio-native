# ADR 0001: React adapter over the shared browser audio core

- Status: accepted
- Date: 2026-07-29

## Context

Vue Audio Native 1.0 and React Audio Native 1.0 must expose the same playback state, source fallback,
playlist, error, Media Session, exclusivity and host-Bridge behavior. Duplicating browser media logic
inside each framework would make WebView fixes drift and would double the compatibility surface.

The React package must remain usable from React 18.2 and 19, import safely during Next.js server
rendering, and avoid pretending to be a React Native native module.

## Decision

- `@trsoliu/audio-core` is the framework-free source of media state and commands.
- `react-audio-native` creates a controller only when its callback ref receives a real
  `HTMLAudioElement`; module import and server rendering perform no media or DOM side effects.
- `<AudioPlayer />` uses `forwardRef` to expose `AudioPlayerHandle`; `useAudioPlayer()` exposes the
  same stable controls with an immutable snapshot.
- Package declarations and adapter tests use the React 18 support line. The Vite fixture verifies a
  React 18 consumer, while the Next fixture and Demo verify React 19.
- Library controls and CSS remain owned by this project. shadcn/ui, Radix, Tailwind Preflight, CVA,
  Sonner and Demo assets are excluded from the npm tarball.
- React Native SDKs, recording, DRM, transcoding, waveform extraction and bundled HLS engines are
  out of scope for 1.0.

## Consequences

The two adapters can share regression cases and host behavior while retaining idiomatic framework
lifecycle integration. React releases depend on a published compatible core version, so the core
prerelease must be published before React CI and registry-consumer verification can run.
