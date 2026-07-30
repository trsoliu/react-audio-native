import type { NextConfig } from 'next'
import { resolve } from 'node:path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Includes the sibling core checkout during prerelease development. In CI,
    // this resolves to the GitHub workspace that contains the repository.
    root: resolve(import.meta.dirname, '../../..'),
  },
}

export default nextConfig
