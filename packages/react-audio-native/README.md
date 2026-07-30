# react-audio-native

An accessible React DOM audio player and headless Hook powered by `@trsoliu/audio-core`. It targets
desktop and mobile browsers, WKWebView, Android WebView and capability-detected HarmonyOS ArkWeb.
It is not a React Native native module.

```bash
pnpm add react-audio-native
```

During the 1.0 prerelease, use `pnpm add react-audio-native@next`.

```tsx
'use client'

import { AudioPlayer, type AudioTrack } from 'react-audio-native'
import 'react-audio-native/style.css'

const tracks: readonly AudioTrack[] = [
  {
    id: 'episode-1',
    title: 'Episode 1',
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
      exclusive
      group="podcast"
      onError={(error) => console.error(error.code)}
    />
  )
}
```

The component forwards an `AudioPlayerHandle` ref. `useAudioPlayer()` returns a callback `audioRef`,
the immutable `snapshot`, and stable command `controls`. Media elements are only connected when the
callback ref receives a browser `HTMLAudioElement`, so importing and server-rendering the package does
not create DOM or media objects.

## Headless Hook

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
    <div>
      <audio ref={audioRef} />
      <button type="button" onClick={() => void controls.toggle()}>
        {snapshot.state === 'playing' ? 'Pause' : 'Play'}
      </button>
    </div>
  )
}
```

## Component API

`src` accepts a URL, one typed source, or ordered sources. `tracks` accepts a playlist and takes
precedence over `src`. The main options are `nativeControls`, `repeatMode`, `playbackRate`,
`mediaSession`, `exclusive`, `group`, `autoplay`, `preload`, `volume`, `muted` and `waitBuffer`.

Lifecycle callbacks are `onReady`, `onPlay`, `onPause`, `onEnded`, `onTimeUpdate`,
`onStateChange`, `onTrackChange` and `onError`. Composition points are `artwork`,
`beforeControls`, `afterControls` and `hint`.

The forwarded handle provides `play`, `pause`, `toggle`, `stop`, `seekTo`, `skipBy`,
`selectTrack`, `previous`, `next`, volume/mute/rate/repeat setters and `getElement`.

## WebView Bridge

```ts
const bridge = {
  emit(event) {
    hostTransport.postMessage(JSON.stringify(event))
  },
}
```

Pass `bridge` to the component or Hook. It reports state, track and structured error events without
binding to `WKScriptMessageHandler`, Android `JavascriptInterface` or an ArkWeb host protocol.
Removing the prop or Hook option detaches the old host before a simultaneous source update.

The standalone stylesheet is compiled without Tailwind Preflight. Theme the component through
`--audio-native-*` CSS variables; consumers do not need Tailwind.

The supported runtime baseline is Chromium 96+, Firefox 115+, Safari/WKWebView 15.6+, Android 8+
WebView 96+, and capability-detected HarmonyOS WebView/ArkWeb. Older engines fall back to native
controls when possible. IE11 and React Native native runtimes are not supported.
