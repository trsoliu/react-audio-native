# react-audio-native

An accessible, typed audio player and headless Hook for React DOM, desktop/mobile browsers, and
embedded WebViews. It is powered by the event-driven `@trsoliu/audio-core` contract and is **not**
a React Native native module.

The package supports React 18.2 and 19, SSR-safe imports, playlists, ordered source fallback,
repeat modes, buffered seeking, playback rate, structured errors, Media Session, optional
exclusive groups, and a protocol-neutral WebView Bridge.

## Install

```bash
pnpm add react-audio-native@next
```

The 1.0 line is currently a prerelease. Import the standalone package CSS; consumers do not need
Tailwind:

```tsx
import { AudioPlayer } from 'react-audio-native'
import 'react-audio-native/style.css'
```

## Quick start

```tsx
'use client'

import { AudioPlayer, type AudioTrack } from 'react-audio-native'
import 'react-audio-native/style.css'

const tracks: readonly AudioTrack[] = [
  {
    id: 'episode-1',
    title: 'Episode 1',
    artist: 'Audio Native',
    artwork: [{ src: '/cover.webp', sizes: '512x512', type: 'image/webp' }],
    sources: [
      { src: '/episode-1.ogg', type: 'audio/ogg' },
      { src: '/episode-1.mp3', type: 'audio/mpeg' },
    ],
  },
]

export function Player() {
  return (
    <AudioPlayer
      tracks={tracks}
      repeatMode="all"
      mediaSession
      onStateChange={(snapshot) => console.log(snapshot.state)}
      onError={(error) => console.error(error.code, error.message)}
    />
  )
}
```

Non-empty `tracks` take precedence over `src`.

## Exports

Runtime exports from `react-audio-native`:

- `AudioPlayer`
- `useAudioPlayer()`
- `detectAudioCapabilities()` and `formatMediaTime()`

Complete type-only exports:

```ts
import type {
  AudioPlayerProps,
  AudioPlayerSize,
  UseAudioPlayerResult,
  AudioBridgeEvent,
  AudioControllerOptions,
  AudioInput,
  AudioPlayerBridge,
  AudioPlayerError,
  AudioPlayerErrorCode,
  AudioPlayerHandle,
  AudioRuntimeCapabilities,
  AudioSnapshot,
  AudioSource,
  AudioSourceInput,
  AudioTrack,
  BufferedRange,
  PlaybackState,
  PreloadMode,
  RepeatMode,
} from 'react-audio-native'
```

For the low-level controller, import directly from `@trsoliu/audio-core`. The React package does
not re-export the `createAudioController`, normalization helpers, or `AudioControllerError` runtime
values.

## Inputs

```ts
interface AudioSource {
  src: string
  type?: string
}

interface AudioTrack {
  id: string
  title?: string
  artist?: string
  album?: string
  artwork?: MediaImage[]
  sources: AudioSource | readonly AudioSource[]
  downloadName?: string
  peaks?: readonly number[]
}
```

`src` accepts one URL, one typed source, or an ordered array of either form. Empty URLs are removed
and duplicate URLs keep their first position. The core uses `canPlayType()` to prefer supported
MIME types, then tries later sources after media failure. A fatal error is reported only after the
last source fails.

Tracks with no usable source are removed. A lone `src` becomes a synthetic track with
`id: 'audio-source'`. Waveforms render only caller-provided `peaks`; the package never fetches or
decodes audio to derive them.

## Component props

`AudioPlayerProps` extends the shared `AudioControllerOptions` contract.

### Input and playback

| Prop           | Type                                              | Default      | Behavior                                                                      |
| -------------- | ------------------------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| `tracks`       | `readonly AudioTrack[]`                           | —            | Playlist; non-empty values override `src`                                     |
| `src`          | `AudioSourceInput \| readonly AudioSourceInput[]` | —            | Single item with ordered format fallback                                      |
| `autoplay`     | `boolean`                                         | `false`      | Attempts playback after attach/input changes; policy rejection is recoverable |
| `preload`      | `'none' \| 'metadata' \| 'auto'`                  | `'metadata'` | Native `<audio>` preload mode                                                 |
| `volume`       | `number`                                          | `1`          | Provide a finite value; finite values clamp to `0`–`1`                        |
| `muted`        | `boolean`                                         | `false`      | Native muted state                                                            |
| `playbackRate` | `number`                                          | `1`          | Provide a finite value; finite values clamp to `0.25`–`4`                     |
| `repeatMode`   | `'off' \| 'one' \| 'all'`                         | `'off'`      | End-of-track behavior                                                         |
| `waitBuffer`   | `boolean`                                         | `true`       | When `false`, seeking cannot move beyond the greatest buffered end time       |

### Integration and presentation

| Prop              | Type                                  | Default                       | Behavior                                                                               |
| ----------------- | ------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `exclusive`       | `boolean`                             | `false`                       | Pauses peers only when both players are exclusive and share a group                    |
| `group`           | `string`                              | `'default'`                   | Exclusive coordination group; blank values become `default`                            |
| `mediaSession`    | `boolean`                             | `false`                       | Opts into lock-screen metadata, state, and media actions                               |
| `bridge`          | `AudioPlayerBridge \| null`           | `null`                        | Protocol-neutral host event sink                                                       |
| `nativeControls`  | `boolean`                             | `false`                       | Forces browser controls; capability gaps also trigger native fallback                  |
| `showCurrentTime` | `boolean`                             | `true`                        | Shows current time and duration in custom controls                                     |
| `showVolume`      | `boolean`                             | `true`                        | Shows mute and volume controls                                                         |
| `showDownload`    | `boolean`                             | `true`                        | Shows a link when a source exists; the browser decides `download`/cross-origin support |
| `downloadName`    | `string`                              | `''`                          | Fallback filename; `track.downloadName` wins                                           |
| `size`            | `'small' \| 'default' \| 'large'`     | `'default'`                   | Selects package sizing through `data-size`                                             |
| `className`       | `string`                              | —                             | Appended to the root `audio-native` class                                              |
| `hint`            | `ReactNode`                           | `'No playable audio source.'` | Empty state when no valid track exists                                                 |
| `artwork`         | `ReactNode \| ((track) => ReactNode)` | first image                   | Fixed artwork or a renderer for the selected track                                     |
| `beforeControls`  | `ReactNode`                           | —                             | Content before the standard custom controls                                            |
| `afterControls`   | `ReactNode`                           | —                             | Content after the standard custom controls                                             |

`beforeControls` and `afterControls` are plain React nodes, not render props. Use the forwarded
handle or headless Hook when that content needs controls/state. They are not rendered in native
controls mode; artwork still is.

## Callback events

Callbacks describe `AudioSnapshot` transitions. They are not one-for-one proxies for native media
events and run from a React effect after the matching render.

| Callback        | Payload                                                   | When it runs                                                                                                                          |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `onStateChange` | `(snapshot: AudioSnapshot) => void`                       | Every actual state transition, including `loading`, `buffering`, and fatal `error`                                                    |
| `onReady`       | `(snapshot: AudioSnapshot) => void`                       | State enters `ready`; normally after `canplay` while paused, or after a play request is rejected during loading; not a metadata alias |
| `onPlay`        | `(snapshot: AudioSnapshot) => void`                       | State enters `playing`; buffering recovery can call it again without a new command                                                    |
| `onPause`       | `(snapshot: AudioSnapshot) => void`                       | State enters `paused`, including programmatic and exclusive-group pauses                                                              |
| `onEnded`       | `(snapshot: AudioSnapshot) => void`                       | State enters `ended`; repeat/automatic playlist advance continues without this terminal callback                                      |
| `onTimeUpdate`  | `(currentTime: number, snapshot: AudioSnapshot) => void`  | Snapshot time changes; active playback can update more often than native `timeupdate`                                                 |
| `onTrackChange` | `(track: AudioTrack \| null, trackIndex: number) => void` | Selected track/index changes; use the snapshot for the initial selection                                                              |
| `onError`       | `(error: AudioPlayerError) => void`                       | A new public error appears; native media errors that advance to another source are not reported                                       |

```tsx
<AudioPlayer
  src="/episode.mp3"
  onReady={(snapshot) => console.log(snapshot.duration)}
  onTimeUpdate={(seconds, snapshot) =>
    saveProgress(snapshot.track?.id, seconds)
  }
  onTrackChange={(track, index) => console.log(index, track?.id)}
  onError={(error) => handlePlaybackError(error.code)}
/>
```

`AUTOPLAY_BLOCKED` calls `onError` but usually leaves the snapshot in `ready` or `paused`; let the
user retry from a gesture instead of treating it as fatal.

## Snapshot contract

```ts
interface AudioSnapshot {
  state:
    | 'idle'
    | 'loading'
    | 'ready'
    | 'playing'
    | 'paused'
    | 'buffering'
    | 'ended'
    | 'error'
  track: AudioTrack | null
  trackIndex: number
  currentTime: number
  duration: number | null
  buffered: readonly { start: number; end: number }[]
  volume: number
  muted: boolean
  playbackRate: number
  repeatMode: 'off' | 'one' | 'all'
  error: AudioPlayerError | null
}
```

Snapshots are new, top-level frozen objects. `duration` is `null` while unknown/invalid and
`trackIndex` is `-1` when no track exists.

| State       | Meaning                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------- |
| `idle`      | No real audio element is attached yet, or no valid input exists                                    |
| `loading`   | A source was selected and loading started                                                          |
| `ready`     | Paused/retryable; normally entered by `canplay`, or after a play request is rejected while loading |
| `playing`   | Playback is active                                                                                 |
| `paused`    | Playback is paused                                                                                 |
| `buffering` | `waiting` or `stalled` occurred during active playback                                             |
| `ended`     | The playlist reached its boundary without another repeat/track transition                          |
| `error`     | All usable sources failed or another fatal media error occurred                                    |

## Structured errors

```ts
interface AudioPlayerError {
  code:
    | 'AUTOPLAY_BLOCKED'
    | 'SOURCE_NOT_SUPPORTED'
    | 'MEDIA_ABORTED'
    | 'NETWORK'
    | 'DECODE'
    | 'UNKNOWN'
  message: string
  mediaErrorCode?: number
  cause?: unknown
}
```

| Code                   | Typical source                                                            | Recovery                                      |
| ---------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| `AUTOPLAY_BLOCKED`     | Browser gesture policy rejected `play()`                                  | Let the user call `play()` from a gesture     |
| `SOURCE_NOT_SUPPORTED` | Missing input/ref, native media error 4, or exhausted unsupported sources | Attach the ref or provide another format      |
| `MEDIA_ABORTED`        | Native media error 1                                                      | Reload or replace the source                  |
| `NETWORK`              | Native media error 2                                                      | Retry and inspect URL, CORS, and connectivity |
| `DECODE`               | Native media error 3                                                      | Use a compatible encoding or fallback source  |
| `UNKNOWN`              | Other play/media failures                                                 | Inspect `cause` and offer retry/fallback      |

## Imperative handle

`AudioPlayer` forwards an `AudioPlayerHandle` ref:

```tsx
import { useRef } from 'react'
import { AudioPlayer, type AudioPlayerHandle } from 'react-audio-native'

export function Player() {
  const playerRef = useRef<AudioPlayerHandle>(null)

  return (
    <>
      <AudioPlayer ref={playerRef} src="/episode.mp3" />
      <button type="button" onClick={() => void playerRef.current?.play()}>
        Play
      </button>
    </>
  )
}
```

| Method                                | Return                     | Behavior                                                                     |
| ------------------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| `play()`                              | `Promise<void>`            | Requests playback; rejects with a structured controller error                |
| `pause()`                             | `void`                     | Pauses playback                                                              |
| `toggle()`                            | `Promise<void>`            | Plays or pauses from the native paused state                                 |
| `stop()`                              | `void`                     | Pauses and seeks to zero                                                     |
| `seekTo(seconds)` / `skipBy(seconds)` | `void`                     | Absolute/relative seek under duration and buffer policy                      |
| `selectTrack(index)`                  | `Promise<void>`            | Selects a valid integer index; out-of-range values throw `RangeError`        |
| `previous()` / `next()`               | `Promise<void>`            | Playlist navigation; previous restarts the current track when past 3 seconds |
| `setVolume(value)`                    | `void`                     | Requires a finite value and clamps it to `0`–`1`                             |
| `setMuted(value)`                     | `void`                     | Updates mute state                                                           |
| `setPlaybackRate(value)`              | `void`                     | Requires a finite value and clamps it to `0.25`–`4`                          |
| `setRepeatMode(mode)`                 | `void`                     | Updates `off`, `one`, or `all`                                               |
| `getElement()`                        | `HTMLAudioElement \| null` | Returns the current native element                                           |

## Headless Hook

`useAudioPlayer(options?)` returns a callback `audioRef`, the immutable `snapshot`, and stable
`controls`:

```tsx
'use client'

import { useAudioPlayer } from 'react-audio-native'

export function HeadlessPlayer() {
  const { audioRef, controls, snapshot } = useAudioPlayer({
    src: '/episode.mp3',
    exclusive: true,
    group: 'podcast',
  })

  return (
    <>
      <audio ref={audioRef} />
      <button type="button" onClick={() => void controls.toggle()}>
        {snapshot.state === 'playing' ? 'Pause' : 'Play'}
      </button>
    </>
  )
}
```

- Attach `audioRef` to a real `<audio>` element. Receiving `null` destroys the old controller.
- Before attach, `play`, `toggle`, `previous`, `next`, and `selectTrack` return Promises rejected
  with `SOURCE_NOT_SUPPORTED`; synchronous setters/pause are safe no-ops and `getElement()` is
  `null`.
- Option changes update the current controller; input changes reset selection to the first valid
  track.
- Callback-ref attach/detach keeps StrictMode remounts idempotent and cleans media listeners,
  animation frames, exclusive registration, and Media Session ownership.

## WebView Bridge

Both the component and Hook accept a protocol-neutral `bridge`:

```tsx
const bridge = {
  emit(event) {
    hostTransport.postMessage(JSON.stringify(event))
  },
}

<AudioPlayer src="/episode.mp3" bridge={bridge} />
```

Bridge event shapes are:

```ts
type AudioBridgeEvent =
  | { type: 'statechange'; snapshot: AudioSnapshot }
  | {
      type: 'trackchange'
      snapshot: AudioSnapshot
      track: AudioTrack | null
      trackIndex: number
    }
  | { type: 'error'; snapshot: AudioSnapshot; error: AudioPlayerError }
```

- `statechange` is sent only when snapshot state changes.
- `trackchange` is sent when track/index changes and once on controller attach when a track is
  already selected.
- `error` is sent when a new public error object appears.
- Host exceptions are isolated from playback.
- Removing the prop or passing `undefined`/`null` detaches the old host before a simultaneous input
  update.

Host code chooses its own WKWebView, Android `JavascriptInterface`, ArkWeb, or other transport,
serialization, and authentication protocol.

## Styling

Import `react-audio-native/style.css`. It contains no Tailwind Preflight, global utilities,
shadcn, Radix, OKLCH, or `color-mix()` output.

```css
.audio-native {
  --audio-native-background: #0b0f14;
  --audio-native-foreground: #f5f7fa;
  --audio-native-muted: #9aa4b2;
  --audio-native-border: #303846;
  --audio-native-accent: #70f37c;
  --audio-native-accent-foreground: #061008;
}
```

## SSR and browser boundary

The ESM entry includes `'use client'`, and importing/server-rendering the package creates no DOM or
media objects. The controller is created only after the callback ref receives a real audio element.
Use the component from a Client Component in Next App Router.

Capability detection—not user-agent parsing—selects custom versus native controls. Media Session
is opt-in, native HLS is passed through when available, and no HLS engine or audio analysis runtime
is bundled.

The supported baseline is Chromium 96+, Firefox 115+, Safari/WKWebView 15.6+, Android 8+ WebView
96+, and capability-detected HarmonyOS WebView/ArkWeb. IE11 and React Native native runtimes are not
supported.

Full Chinese API documentation is available at
<https://trsoliu.github.io/react-audio-native/api/>. The published `.d.ts` files remain the final
machine-readable contract.
