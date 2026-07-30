import { AudioPlayer } from 'react-audio-native'

export default function Page() {
  return (
    <main>
      <h1>Next.js SSR fixture</h1>
      <p>
        The package can cross a Server Component boundary without DOM access.
      </p>
      <AudioPlayer src="/fixture.wav" />
    </main>
  )
}
