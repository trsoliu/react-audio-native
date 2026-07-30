import {
  detectAudioCapabilities,
  type AudioBridgeEvent,
  type AudioRuntimeCapabilities,
  useAudioPlayer,
} from 'react-audio-native'
import { useCallback, useMemo, useState } from 'react'

import { createToneUrl } from './tone'

export function App() {
  const toneUrl = useMemo(() => createToneUrl(), [])
  const [capabilities, setCapabilities] =
    useState<AudioRuntimeCapabilities | null>(null)
  const [events, setEvents] = useState<AudioBridgeEvent[]>([])
  const bridge = useMemo(
    () => ({
      emit(event: AudioBridgeEvent): void {
        setEvents((current) => [event, ...current].slice(0, 12))
      },
    }),
    [],
  )
  const { audioRef, controls, snapshot } = useAudioPlayer({
    bridge,
    src: { src: toneUrl, type: 'audio/wav' },
  })

  const attachAudio = useCallback(
    (element: HTMLAudioElement | null): void => {
      audioRef(element)
      if (element) setCapabilities(detectAudioCapabilities(element))
    },
    [audioRef],
  )

  return (
    <main>
      <header>
        <p className="eyebrow">AUDIO NATIVE / CAPABILITY PROBE</p>
        <h1>Browser &amp; WebView compatibility lab</h1>
        <p>
          A UA-independent harness for Chromium, Gecko, WebKit, WKWebView,
          Android WebView and HarmonyOS ArkWeb device-cloud runs.
        </p>
      </header>

      <section aria-labelledby="capability-heading">
        <h2 id="capability-heading">Runtime capabilities</h2>
        {capabilities ? (
          <dl className="matrix">
            {Object.entries(capabilities).map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd data-supported={value}>
                  {value ? 'available' : 'fallback'}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p role="status">Waiting for a media element…</p>
        )}
      </section>

      <section aria-labelledby="player-heading">
        <h2 id="player-heading">Native media probe</h2>
        <audio ref={attachAudio} controls preload="metadata" />
        <div className="controls">
          <button type="button" onClick={() => void controls.play()}>
            Play
          </button>
          <button type="button" onClick={() => controls.pause()}>
            Pause
          </button>
          <button type="button" onClick={() => controls.skipBy(5)}>
            Skip +5
          </button>
          <button type="button" onClick={() => controls.setPlaybackRate(1.5)}>
            1.5×
          </button>
        </div>
        <pre>{JSON.stringify(snapshot, null, 2)}</pre>
      </section>

      <section aria-labelledby="bridge-heading">
        <h2 id="bridge-heading">Host bridge events</h2>
        <ol aria-live="polite">
          {events.map((event, index) => (
            <li key={`${event.type}-${index}`}>
              {event.type} · {event.snapshot.state}
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
