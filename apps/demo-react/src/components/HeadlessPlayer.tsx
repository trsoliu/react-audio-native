import { Pause, Play, RotateCcw } from 'lucide-react'
import { formatMediaTime, useAudioPlayer } from 'react-audio-native'

import { Button } from '@/components/ui/button'

export function HeadlessPlayer({ src }: { src: string }) {
  const { audioRef, controls, snapshot } = useAudioPlayer({ src })
  const playing = snapshot.state === 'playing' || snapshot.state === 'buffering'

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
      <audio ref={audioRef} />
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          aria-label={
            playing ? 'Pause headless player' : 'Play headless player'
          }
          onClick={() => void controls.toggle().catch(() => undefined)}
        >
          {playing ? (
            <Pause data-icon="icon-only" aria-hidden="true" />
          ) : (
            <Play data-icon="icon-only" aria-hidden="true" />
          )}
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label="Restart headless player"
          onClick={() => controls.stop()}
        >
          <RotateCcw data-icon="icon-only" aria-hidden="true" />
        </Button>
        <input
          className="h-2 min-w-0 flex-1 accent-primary"
          type="range"
          min="0"
          max={snapshot.duration ?? 0}
          step="0.01"
          value={snapshot.currentTime}
          aria-label="Headless player progress"
          onChange={(event) =>
            controls.seekTo(Number(event.currentTarget.value))
          }
        />
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatMediaTime(snapshot.currentTime)} /{' '}
          {formatMediaTime(snapshot.duration)}
        </span>
      </div>
      <code className="text-xs text-muted-foreground">
        state: {snapshot.state}
      </code>
    </div>
  )
}
