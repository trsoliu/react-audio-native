import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import 'react-audio-native/style.css'
import './globals.css'

export const metadata: Metadata = {
  description: 'Server build fixture for React Audio Native',
  title: 'React Audio Native · Next fixture',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
