'use client'

import './styles.css'

export { AudioPlayer } from './AudioPlayer'
export { useAudioPlayer } from './use-audio-player'
export type {
  AudioPlayerProps,
  AudioPlayerSize,
  UseAudioPlayerResult,
} from './types'
export {
  detectAudioCapabilities,
  formatMediaTime,
  type AudioBridgeEvent,
  type AudioControllerOptions,
  type AudioInput,
  type AudioPlayerBridge,
  type AudioPlayerError,
  type AudioPlayerErrorCode,
  type AudioPlayerHandle,
  type AudioRuntimeCapabilities,
  type AudioSnapshot,
  type AudioSource,
  type AudioSourceInput,
  type AudioTrack,
  type BufferedRange,
  type PlaybackState,
  type PreloadMode,
  type RepeatMode,
} from '@trsoliu/audio-core'
