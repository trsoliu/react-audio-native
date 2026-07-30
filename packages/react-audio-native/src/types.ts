import type {
  AudioControllerOptions,
  AudioPlayerError,
  AudioPlayerHandle,
  AudioSnapshot,
  AudioTrack,
} from '@trsoliu/audio-core'
import type { ReactNode, RefCallback } from 'react'

export type AudioPlayerSize = 'small' | 'default' | 'large'

export interface UseAudioPlayerResult {
  audioRef: RefCallback<HTMLAudioElement>
  snapshot: AudioSnapshot
  controls: AudioPlayerHandle
}

export interface AudioPlayerProps extends AudioControllerOptions {
  afterControls?: ReactNode
  artwork?: ReactNode | ((track: AudioTrack) => ReactNode)
  beforeControls?: ReactNode
  className?: string
  downloadName?: string
  hint?: ReactNode
  nativeControls?: boolean
  onEnded?: (snapshot: AudioSnapshot) => void
  onError?: (error: AudioPlayerError) => void
  onPause?: (snapshot: AudioSnapshot) => void
  onPlay?: (snapshot: AudioSnapshot) => void
  onReady?: (snapshot: AudioSnapshot) => void
  onStateChange?: (snapshot: AudioSnapshot) => void
  onTimeUpdate?: (currentTime: number, snapshot: AudioSnapshot) => void
  onTrackChange?: (track: AudioTrack | null, trackIndex: number) => void
  showCurrentTime?: boolean
  showDownload?: boolean
  showVolume?: boolean
  size?: AudioPlayerSize
}
