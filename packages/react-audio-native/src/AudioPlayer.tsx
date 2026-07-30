import {
  detectAudioCapabilities,
  formatMediaTime,
  normalizeSources,
  type AudioPlayerHandle,
  type AudioSnapshot,
  type AudioTrack,
} from '@trsoliu/audio-core'
import {
  Download,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  type ComponentType,
  forwardRef,
  type SVGProps,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { AudioPlayerProps } from './types'
import { useAudioPlayer } from './use-audio-player'

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ')
}

type CompatibleIcon = ComponentType<SVGProps<SVGSVGElement>>

// Keep the package declaration floor on React 18 even when a monorepo also installs React 19
// types for its Demo. Lucide supports both runtimes; this local boundary prevents duplicate
// @types/react majors from leaking into the public component declaration.
const DownloadIcon = Download as unknown as CompatibleIcon
const PauseIcon = Pause as unknown as CompatibleIcon
const PlayIcon = Play as unknown as CompatibleIcon
const SkipBackIcon = SkipBack as unknown as CompatibleIcon
const SkipForwardIcon = SkipForward as unknown as CompatibleIcon
const Volume2Icon = Volume2 as unknown as CompatibleIcon
const VolumeXIcon = VolumeX as unknown as CompatibleIcon

export const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  function AudioPlayer(
    {
      afterControls,
      artwork,
      autoplay = false,
      beforeControls,
      bridge,
      className,
      downloadName = '',
      exclusive = false,
      group = 'default',
      hint = 'No playable audio source.',
      mediaSession = false,
      muted = false,
      nativeControls = false,
      onEnded,
      onError,
      onPause,
      onPlay,
      onReady,
      onStateChange,
      onTimeUpdate,
      onTrackChange,
      playbackRate = 1,
      preload = 'metadata',
      repeatMode = 'off',
      showCurrentTime = true,
      showDownload = true,
      showVolume = true,
      size = 'default',
      src,
      tracks,
      volume = 1,
      waitBuffer = true,
    },
    forwardedRef,
  ) {
    const playerOptions = useMemo(
      () => ({
        autoplay,
        bridge,
        exclusive,
        group,
        mediaSession,
        muted,
        playbackRate,
        preload,
        repeatMode,
        src,
        tracks,
        volume,
        waitBuffer,
      }),
      [
        autoplay,
        bridge,
        exclusive,
        group,
        mediaSession,
        muted,
        playbackRate,
        preload,
        repeatMode,
        src,
        tracks,
        volume,
        waitBuffer,
      ],
    )
    const { audioRef, controls, snapshot } = useAudioPlayer(playerOptions)
    const audioElementRef = useRef<HTMLAudioElement | null>(null)
    const previousSnapshot = useRef<AudioSnapshot>(snapshot)
    const [customControlsSupported, setCustomControlsSupported] = useState(true)

    useImperativeHandle(forwardedRef, () => controls, [controls])

    const attachAudio = useCallback(
      (element: HTMLAudioElement | null): void => {
        audioElementRef.current = element
        audioRef(element)
        if (element) {
          setCustomControlsSupported(
            detectAudioCapabilities(element).customControls,
          )
        }
      },
      [audioRef],
    )

    useEffect(() => {
      const previous = previousSnapshot.current
      if (snapshot.state !== previous.state) {
        onStateChange?.(snapshot)
        if (snapshot.state === 'ready') onReady?.(snapshot)
        if (snapshot.state === 'playing') onPlay?.(snapshot)
        if (snapshot.state === 'paused') onPause?.(snapshot)
        if (snapshot.state === 'ended') onEnded?.(snapshot)
      }
      if (snapshot.currentTime !== previous.currentTime) {
        onTimeUpdate?.(snapshot.currentTime, snapshot)
      }
      if (
        snapshot.trackIndex !== previous.trackIndex ||
        snapshot.track !== previous.track
      ) {
        onTrackChange?.(snapshot.track, snapshot.trackIndex)
      }
      if (snapshot.error && snapshot.error !== previous.error) {
        onError?.(snapshot.error)
      }
      previousSnapshot.current = snapshot
    }, [
      onEnded,
      onError,
      onPause,
      onPlay,
      onReady,
      onStateChange,
      onTimeUpdate,
      onTrackChange,
      snapshot,
    ])

    const useNativeControls = nativeControls || !customControlsSupported
    const duration = snapshot.duration
    const isPlaying =
      snapshot.state === 'playing' || snapshot.state === 'buffering'
    const sources = snapshot.track
      ? normalizeSources(snapshot.track.sources)
      : []
    const downloadSource =
      audioElementRef.current?.src ||
      audioElementRef.current?.currentSrc ||
      sources[0]?.src ||
      ''
    const effectiveDownloadName = snapshot.track?.downloadName ?? downloadName
    const progressRatio =
      duration && duration > 0
        ? Math.min(1, snapshot.currentTime / duration)
        : 0
    const rawPeaks = snapshot.track?.peaks ?? []
    const waveform =
      rawPeaks.length <= 96
        ? rawPeaks
        : Array.from(
            { length: 96 },
            (_, index) =>
              rawPeaks[Math.floor(index * (rawPeaks.length / 96))] ?? 0,
          )

    function renderArtwork(track: AudioTrack) {
      if (typeof artwork === 'function') return artwork(track)
      if (artwork !== undefined) return artwork
      const image = track.artwork?.[0]
      return image ? (
        <img
          className="audio-native__artwork"
          src={image.src}
          alt={track.title ? `${track.title} artwork` : 'Audio artwork'}
        />
      ) : null
    }

    function togglePlayback(): void {
      void controls.toggle().catch(() => undefined)
    }

    return (
      <section
        className={joinClassNames('audio-native', className)}
        data-size={size}
        data-state={snapshot.state}
        aria-busy={
          snapshot.state === 'loading' || snapshot.state === 'buffering'
        }
      >
        <audio
          ref={attachAudio}
          className="audio-native__element"
          controls={useNativeControls}
          preload={preload}
        />

        {snapshot.track ? (
          <>
            <div className="audio-native__track">
              {renderArtwork(snapshot.track)}
              <div className="audio-native__track-copy">
                {snapshot.track.title ? (
                  <p className="audio-native__title">{snapshot.track.title}</p>
                ) : null}
                {snapshot.track.artist ? (
                  <p className="audio-native__artist">
                    {snapshot.track.artist}
                  </p>
                ) : null}
              </div>
            </div>

            {!useNativeControls ? (
              <div className="audio-native__custom-controls">
                {beforeControls}

                {waveform.length > 0 ? (
                  <div className="audio-native__waveform" aria-hidden="true">
                    {waveform.map((peak, index) => (
                      <span
                        key={index}
                        className={joinClassNames(
                          'audio-native__peak',
                          index / waveform.length <= progressRatio
                            ? 'is-active'
                            : undefined,
                        )}
                        style={{
                          height: `${Math.max(
                            8,
                            Math.min(100, Math.abs(peak) * 100),
                          )}%`,
                        }}
                      />
                    ))}
                  </div>
                ) : null}

                <input
                  className="audio-native__range audio-native__progress"
                  type="range"
                  min="0"
                  max={duration ?? 0}
                  step="0.01"
                  value={snapshot.currentTime}
                  disabled={duration === null}
                  aria-label="Audio progress"
                  onChange={(event) =>
                    controls.seekTo(Number(event.currentTarget.value))
                  }
                />

                <div className="audio-native__toolbar">
                  {tracks && tracks.length > 1 ? (
                    <button
                      className="audio-native__icon-button"
                      type="button"
                      aria-label="Previous track"
                      title="Previous track"
                      onClick={() => void controls.previous()}
                    >
                      <SkipBackIcon aria-hidden="true" />
                    </button>
                  ) : null}
                  <button
                    className="audio-native__play-button"
                    type="button"
                    aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                    title={isPlaying ? 'Pause audio' : 'Play audio'}
                    onClick={togglePlayback}
                  >
                    {isPlaying ? (
                      <PauseIcon aria-hidden="true" />
                    ) : (
                      <PlayIcon aria-hidden="true" />
                    )}
                  </button>
                  {tracks && tracks.length > 1 ? (
                    <button
                      className="audio-native__icon-button"
                      type="button"
                      aria-label="Next track"
                      title="Next track"
                      onClick={() => void controls.next()}
                    >
                      <SkipForwardIcon aria-hidden="true" />
                    </button>
                  ) : null}

                  {showCurrentTime ? (
                    <span className="audio-native__time">
                      {formatMediaTime(snapshot.currentTime)} /{' '}
                      {formatMediaTime(duration)}
                    </span>
                  ) : null}

                  {showVolume ? (
                    <div className="audio-native__volume-control">
                      <button
                        className="audio-native__icon-button"
                        type="button"
                        aria-label={
                          snapshot.muted ? 'Unmute audio' : 'Mute audio'
                        }
                        title={snapshot.muted ? 'Unmute audio' : 'Mute audio'}
                        onClick={() => controls.setMuted(!snapshot.muted)}
                      >
                        {snapshot.muted ? (
                          <VolumeXIcon aria-hidden="true" />
                        ) : (
                          <Volume2Icon aria-hidden="true" />
                        )}
                      </button>
                      <input
                        className="audio-native__range audio-native__volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={snapshot.volume}
                        aria-label="Audio volume"
                        onChange={(event) =>
                          controls.setVolume(Number(event.currentTarget.value))
                        }
                      />
                    </div>
                  ) : null}

                  {showDownload && downloadSource ? (
                    <a
                      className="audio-native__icon-button"
                      href={downloadSource}
                      download={effectiveDownloadName}
                      aria-label="Download audio"
                      title="Download audio"
                    >
                      <DownloadIcon aria-hidden="true" />
                    </a>
                  ) : null}
                </div>

                {afterControls}
              </div>
            ) : null}
          </>
        ) : (
          <div className="audio-native__hint" role="status">
            {hint}
          </div>
        )}
      </section>
    )
  },
)

AudioPlayer.displayName = 'AudioPlayer'
