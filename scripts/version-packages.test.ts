import { describe, expect, it } from 'vitest'

import { updateReleaseReadme } from './version-packages'

const readme = `# react-audio-native

<!-- release-install:start -->
old content
<!-- release-install:end -->

## Quick start
`

describe('versioned package README', () => {
  it('keeps prerelease consumers on the next dist-tag', () => {
    const result = updateReleaseReadme(readme, '1.0.0-beta.2')

    expect(result).toContain('pnpm add react-audio-native@next')
    expect(result).toContain('currently a prerelease')
    expect(result).not.toContain('react-audio-native@1.0.0\n')
  })

  it('writes the exact stable version into a stable release package', () => {
    const result = updateReleaseReadme(readme, '1.0.0')

    expect(result).toContain('pnpm add react-audio-native@1.0.0')
    expect(result).toContain('Use `react-audio-native@next` only')
    expect(result).not.toContain('currently a prerelease')
  })

  it('refuses to rewrite a README without the managed section', () => {
    expect(() => updateReleaseReadme('# unmanaged', '1.0.0')).toThrow(
      'managed release install section',
    )
  })
})
