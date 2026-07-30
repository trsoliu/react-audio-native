import { AudioPlayer, type AudioSnapshot } from 'react-audio-native'
import { useState } from 'react'

export function App() {
  const [snapshot, setSnapshot] = useState<AudioSnapshot>()

  return (
    <main>
      <h1>Vite consumer fixture</h1>
      <AudioPlayer
        src={{ src: '/fixture.wav', type: 'audio/wav' }}
        onStateChange={setSnapshot}
      />
      <output>{snapshot?.state ?? 'idle'}</output>
    </main>
  )
}
