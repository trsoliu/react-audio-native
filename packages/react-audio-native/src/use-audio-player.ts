import {
  AudioControllerError,
  createAudioController,
  normalizeInput,
  type AudioController,
  type AudioControllerOptions,
  type AudioInput,
  type AudioPlayerHandle,
  type AudioSnapshot,
} from '@trsoliu/audio-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { UseAudioPlayerResult } from './types'

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value))

function inputFromOptions(options: AudioControllerOptions): AudioInput {
  const input: AudioInput = {}
  if (options.src !== undefined) input.src = options.src
  if (options.tracks !== undefined) input.tracks = options.tracks
  return input
}

function initialSnapshot(options: AudioControllerOptions): AudioSnapshot {
  const tracks = normalizeInput(inputFromOptions(options))
  const trackIndex = tracks.length > 0 ? 0 : -1
  return Object.freeze({
    buffered: [],
    currentTime: 0,
    duration: null,
    error: null,
    muted: options.muted ?? false,
    playbackRate: clamp(options.playbackRate ?? 1, 0.25, 4),
    repeatMode: options.repeatMode ?? 'off',
    state: 'idle',
    track: tracks[trackIndex] ?? null,
    trackIndex,
    volume: clamp(options.volume ?? 1, 0, 1),
  })
}

function unavailable(): Promise<never> {
  return Promise.reject(
    new AudioControllerError(
      'SOURCE_NOT_SUPPORTED',
      'Attach the audioRef to an audio element before using playback controls.',
    ),
  )
}

export function useAudioPlayer(
  options: AudioControllerOptions = {},
): UseAudioPlayerResult {
  const optionsRef = useRef(options)
  const controllerRef = useRef<AudioController | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const [snapshot, setSnapshot] = useState<AudioSnapshot>(() =>
    initialSnapshot(options),
  )

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const disposeController = useCallback((): void => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    controllerRef.current?.destroy()
    controllerRef.current = null
  }, [])

  const audioRef = useCallback(
    (element: HTMLAudioElement | null): void => {
      if (controllerRef.current?.getElement() === element) return
      disposeController()
      if (!element) return

      const controller = createAudioController(optionsRef.current)
      controllerRef.current = controller
      unsubscribeRef.current = controller.subscribe(setSnapshot)
      controller.attach(element)
      setSnapshot(controller.getSnapshot())
    },
    [disposeController],
  )

  useEffect(() => {
    const nextOptions: Partial<AudioControllerOptions> = {
      autoplay: options.autoplay ?? false,
      bridge: options.bridge ?? null,
      exclusive: options.exclusive ?? false,
      group: options.group ?? 'default',
      mediaSession: options.mediaSession ?? false,
      muted: options.muted ?? false,
      playbackRate: options.playbackRate ?? 1,
      preload: options.preload ?? 'metadata',
      repeatMode: options.repeatMode ?? 'off',
      volume: options.volume ?? 1,
      waitBuffer: options.waitBuffer ?? true,
    }
    controllerRef.current?.updateOptions(nextOptions)
  }, [
    options.autoplay,
    options.bridge,
    options.exclusive,
    options.group,
    options.mediaSession,
    options.muted,
    options.playbackRate,
    options.preload,
    options.repeatMode,
    options.volume,
    options.waitBuffer,
  ])

  const inputSignature = JSON.stringify(inputFromOptions(options))
  const previousInputSignature = useRef(inputSignature)
  useEffect(() => {
    if (previousInputSignature.current === inputSignature) return
    previousInputSignature.current = inputSignature
    controllerRef.current?.setInput(inputFromOptions(optionsRef.current))
  }, [inputSignature])

  const controls = useMemo<AudioPlayerHandle>(
    () => ({
      getElement: () => controllerRef.current?.getElement() ?? null,
      next: () => controllerRef.current?.next() ?? unavailable(),
      pause: () => controllerRef.current?.pause(),
      play: () => controllerRef.current?.play() ?? unavailable(),
      previous: () => controllerRef.current?.previous() ?? unavailable(),
      seekTo: (seconds) => controllerRef.current?.seekTo(seconds),
      selectTrack: (index) =>
        controllerRef.current?.selectTrack(index) ?? unavailable(),
      setMuted: (muted) => controllerRef.current?.setMuted(muted),
      setPlaybackRate: (rate) => controllerRef.current?.setPlaybackRate(rate),
      setRepeatMode: (mode) => controllerRef.current?.setRepeatMode(mode),
      setVolume: (volume) => controllerRef.current?.setVolume(volume),
      skipBy: (seconds) => controllerRef.current?.skipBy(seconds),
      stop: () => controllerRef.current?.stop(),
      toggle: () => controllerRef.current?.toggle() ?? unavailable(),
    }),
    [],
  )

  return { audioRef, controls, snapshot }
}
