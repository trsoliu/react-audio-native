import type {
  AudioPlayerBridge,
  AudioPlayerHandle,
  AudioTrack,
} from '@trsoliu/audio-core'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, createRef, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AudioPlayer, useAudioPlayer } from '../src/index'

const tracks: readonly AudioTrack[] = [
  {
    artwork: [{ src: '/cover.svg' }],
    downloadName: 'studio.wav',
    id: 'studio',
    peaks: Array.from({ length: 140 }, (_, index) => (index % 10) / 10),
    sources: [
      { src: '/studio.ogg', type: 'audio/ogg' },
      { src: '/studio.wav', type: 'audio/wav' },
    ],
    title: 'Studio take',
  },
  {
    id: 'second',
    sources: { src: '/second.wav' },
    title: 'Second take',
  },
]

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(
    () => undefined,
  )
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation(
    (type) => (type === 'audio/ogg' ? '' : 'probably'),
  )
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    this.dispatchEvent(new Event('play'))
    this.dispatchEvent(new Event('playing'))
    return Promise.resolve()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    this.dispatchEvent(new Event('pause'))
  })
})

afterEach(cleanup)

describe('react-audio-native', () => {
  it('is safe to render on the server without creating a media element', () => {
    const load = vi.mocked(HTMLMediaElement.prototype.load)

    const html = renderToString(<AudioPlayer src="/ssr.wav" />)

    expect(html).toContain('<audio')
    expect(load).not.toHaveBeenCalled()
  })

  it('keeps the headless hook operational through StrictMode ref lifecycles', () => {
    let player: ReturnType<typeof useAudioPlayer> | undefined
    function Harness() {
      player = useAudioPlayer({ src: '/strict.wav' })
      return <audio ref={player.audioRef} />
    }

    const view = render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    )

    expect(player?.controls.getElement()).toBeInstanceOf(HTMLAudioElement)
    expect(player?.snapshot.track?.sources).toEqual([{ src: '/strict.wav' }])
    view.unmount()
    expect(player?.controls.getElement()).toBeNull()
  })

  it('removes the WebView bridge before switching a headless source', async () => {
    const emit = vi.fn()
    const bridge: AudioPlayerBridge = { emit }
    function Harness({
      activeBridge,
      source,
    }: {
      activeBridge?: AudioPlayerBridge
      source: string
    }) {
      const options = activeBridge
        ? { bridge: activeBridge, src: source }
        : { src: source }
      const player = useAudioPlayer(options)
      return <audio ref={player.audioRef} />
    }

    const view = render(<Harness activeBridge={bridge} source="/bridged.wav" />)
    emit.mockClear()

    view.rerender(<Harness source="/detached.wav" />)
    await waitFor(() =>
      expect(
        (document.querySelector('audio') as HTMLAudioElement).src,
      ).toContain('detached.wav'),
    )
    expect(emit).not.toHaveBeenCalled()
  })

  it('exposes a typed command handle and modern lifecycle callbacks', async () => {
    const reference = createRef<AudioPlayerHandle>()
    const onPlay = vi.fn()
    const onPause = vi.fn()
    const onStateChange = vi.fn()
    render(
      <AudioPlayer
        ref={reference}
        src="/commands.wav"
        onPause={onPause}
        onPlay={onPlay}
        onStateChange={onStateChange}
      />,
    )

    await act(async () => reference.current?.play())
    expect(onPlay).toHaveBeenCalledOnce()
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'playing' }),
    )
    act(() => reference.current?.pause())
    expect(onPause).toHaveBeenCalledOnce()
  })

  it('renders playlist artwork, waveform, source fallback and track controls', async () => {
    const user = userEvent.setup()
    render(<AudioPlayer tracks={tracks} />)

    expect(screen.getByAltText('Studio take artwork')).toBeTruthy()
    expect(document.querySelectorAll('.audio-native__peak')).toHaveLength(96)
    expect(
      screen.getByLabelText('Download audio').getAttribute('href'),
    ).toContain('studio.wav')

    await user.click(screen.getByLabelText('Next track'))
    expect((document.querySelector('audio') as HTMLAudioElement).src).toContain(
      'second.wav',
    )
    await user.click(screen.getByLabelText('Previous track'))
    expect((document.querySelector('audio') as HTMLAudioElement).src).toContain(
      'studio.wav',
    )
  })

  it('supports native controls and accessible custom range inputs', () => {
    const { rerender } = render(
      <AudioPlayer src="/native.wav" nativeControls />,
    )
    const audio = document.querySelector('audio') as HTMLAudioElement
    expect(audio.controls).toBe(true)
    expect(screen.queryByLabelText('Play audio')).toBeNull()

    rerender(<AudioPlayer src="/native.wav" nativeControls={false} />)
    expect(screen.getByLabelText('Play audio')).toBeTruthy()
    expect(screen.getByLabelText('Audio progress')).toBeTruthy()
    expect(screen.getByLabelText('Audio volume')).toBeTruthy()
  })

  it('reports autoplay blocking and leaves custom controls usable', async () => {
    const onError = vi.fn()
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      new DOMException('gesture required', 'NotAllowedError'),
    )
    render(<AudioPlayer src="/blocked.wav" onError={onError} />)

    fireEvent.click(screen.getByLabelText('Play audio'))

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'AUTOPLAY_BLOCKED' }),
      ),
    )
    expect(screen.getByLabelText('Play audio')).toBeTruthy()
  })

  it('returns structured errors from every async control before attachment', async () => {
    let player: ReturnType<typeof useAudioPlayer> | undefined
    function Harness() {
      player = useAudioPlayer({ src: '/detached.wav' })
      return null
    }

    render(<Harness />)

    await expect(player?.controls.play()).rejects.toMatchObject({
      code: 'SOURCE_NOT_SUPPORTED',
    })
    await expect(player?.controls.toggle()).rejects.toMatchObject({
      code: 'SOURCE_NOT_SUPPORTED',
    })
    await expect(player?.controls.next()).rejects.toMatchObject({
      code: 'SOURCE_NOT_SUPPORTED',
    })
    await expect(player?.controls.previous()).rejects.toMatchObject({
      code: 'SOURCE_NOT_SUPPORTED',
    })
    await expect(player?.controls.selectTrack(0)).rejects.toMatchObject({
      code: 'SOURCE_NOT_SUPPORTED',
    })
    player?.controls.pause()
    player?.controls.seekTo(2)
    player?.controls.setMuted(true)
    player?.controls.setPlaybackRate(1.5)
    player?.controls.setRepeatMode('one')
    player?.controls.setVolume(0.4)
    player?.controls.skipBy(4)
    player?.controls.stop()
  })

  it('proxies the full command surface and reacts to source and option changes', async () => {
    let player: ReturnType<typeof useAudioPlayer> | undefined
    function Harness({ muted, source }: { muted: boolean; source: string }) {
      player = useAudioPlayer({
        muted,
        playbackRate: 1.25,
        repeatMode: 'all',
        src: source,
        volume: 0.6,
      })
      return <audio ref={player.audioRef} />
    }

    const view = render(<Harness muted={false} source="/first.wav" />)
    const audio = document.querySelector('audio') as HTMLAudioElement
    expect(audio.src).toContain('first.wav')
    expect(audio.volume).toBe(0.6)

    act(() => {
      player?.controls.setVolume(0.25)
      player?.controls.setMuted(true)
      player?.controls.setPlaybackRate(1.75)
      player?.controls.setRepeatMode('one')
      player?.controls.seekTo(3)
      player?.controls.skipBy(2)
      player?.controls.stop()
    })
    expect(player?.snapshot).toMatchObject({
      muted: true,
      playbackRate: 1.75,
      repeatMode: 'one',
      volume: 0.25,
    })

    view.rerender(<Harness muted source="/updated.wav" />)
    await waitFor(() => expect(audio.src).toContain('updated.wav'))
    expect(audio.muted).toBe(true)
  })

  it('emits ready, time, track and ended callbacks from media events', async () => {
    const onEnded = vi.fn()
    const onReady = vi.fn()
    const onTimeUpdate = vi.fn()
    const onTrackChange = vi.fn()
    render(
      <AudioPlayer
        tracks={tracks}
        onEnded={onEnded}
        onReady={onReady}
        onTimeUpdate={onTimeUpdate}
        onTrackChange={onTrackChange}
      />,
    )
    const audio = document.querySelector('audio') as HTMLAudioElement
    Object.defineProperty(audio, 'duration', {
      configurable: true,
      value: 10,
    })

    fireEvent(audio, new Event('canplay'))
    await waitFor(() => expect(onReady).toHaveBeenCalledOnce())

    audio.currentTime = 4
    fireEvent(audio, new Event('timeupdate'))
    await waitFor(() =>
      expect(onTimeUpdate).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ currentTime: 4 }),
      ),
    )

    fireEvent.click(screen.getByLabelText('Next track'))
    await waitFor(() =>
      expect(onTrackChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: 'second' }),
        1,
      ),
    )

    fireEvent(audio, new Event('ended'))
    await waitFor(() => expect(onEnded).toHaveBeenCalledOnce())
  })

  it('supports composition slots and every optional custom control', async () => {
    const artwork = <div data-testid="custom-artwork">custom cover</div>
    const { rerender } = render(
      <AudioPlayer
        src="/composed.wav"
        artwork={artwork}
        beforeControls={<span>before controls</span>}
        afterControls={<span>after controls</span>}
        downloadName="composed.wav"
      />,
    )
    const audio = document.querySelector('audio') as HTMLAudioElement
    Object.defineProperty(audio, 'duration', {
      configurable: true,
      value: 20,
    })
    fireEvent(audio, new Event('durationchange'))

    expect(screen.getByTestId('custom-artwork')).toBeTruthy()
    expect(screen.getByText('before controls')).toBeTruthy()
    expect(screen.getByText('after controls')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Audio progress'), {
      target: { value: '7' },
    })
    fireEvent.change(screen.getByLabelText('Audio volume'), {
      target: { value: '0.3' },
    })
    fireEvent.click(screen.getByLabelText('Mute audio'))
    expect(screen.getByLabelText('Unmute audio')).toBeTruthy()

    rerender(
      <AudioPlayer
        src="/minimal.wav"
        showCurrentTime={false}
        showDownload={false}
        showVolume={false}
      />,
    )
    expect(screen.queryByLabelText('Audio volume')).toBeNull()
    expect(screen.queryByLabelText('Download audio')).toBeNull()
    expect(document.querySelector('.audio-native__time')).toBeNull()
  })

  it('renders an accessible hint when no track can be normalized', () => {
    const hint: ReactNode = <strong>No source configured</strong>
    render(<AudioPlayer hint={hint} />)

    expect(screen.getByRole('status').textContent).toBe('No source configured')
  })
})
