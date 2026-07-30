import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

import { afterEach, describe, expect, it } from 'vitest'

import {
  detectPrereleaseVersionCommit,
  detectStableVersionCommit,
  inspectReleaseState,
  isPrereleaseVersionCommit,
  isStableVersionCommit,
} from './release-state'

const temporaryDirectories: string[] = []
const workspaceRoot = resolve(import.meta.dirname, '..')
const execFileAsync = promisify(execFile)

async function createFixture(
  options: {
    changesetBody?: string
    changesetId?: string
    consumedChangesets?: string[]
    mode?: 'exit' | 'pre'
    withPrereleaseState?: boolean
  } = {},
): Promise<string> {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'audio-release-state-'))
  temporaryDirectories.push(repositoryRoot)
  await mkdir(join(repositoryRoot, '.changeset'), { recursive: true })

  if (options.withPrereleaseState !== false) {
    await writeFile(
      join(repositoryRoot, '.changeset/pre.json'),
      JSON.stringify({
        changesets: options.consumedChangesets ?? [],
        mode: options.mode ?? 'pre',
        tag: 'beta',
      }),
    )
  }

  if (options.changesetId) {
    await writeFile(
      join(repositoryRoot, `.changeset/${options.changesetId}.md`),
      options.changesetBody ??
        '---\n"react-audio-native": patch\n---\n\nA release change.\n',
    )
  }

  return repositoryRoot
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

describe('Changesets release state', () => {
  it('does not reconsider already-published bootstrap changesets', async () => {
    const state = await inspectReleaseState(workspaceRoot)

    if (state.mode === 'beta') {
      expect(state.pendingChangesets).not.toContain('react-audio-v1')
    }
  })

  it('accepts a versioning push or manual recovery and rejects unrelated events', () => {
    const previousPrereleaseState = {
      changesets: ['bootstrap'],
      mode: 'pre',
      tag: 'beta',
    }
    const currentPrereleaseState = {
      changesets: ['bootstrap', 'next-change'],
      mode: 'pre',
      tag: 'beta',
    }

    expect(
      isPrereleaseVersionCommit({
        changedFiles: [
          '.changeset/pre.json',
          'packages/react-audio-native/package.json',
        ],
        currentPrereleaseState,
        currentVersions: ['1.0.0-beta.2'],
        eventName: 'push',
        beforeIsAncestorOfHead: true,
        manifestPaths: ['packages/react-audio-native/package.json'],
        previousPrereleaseState,
        previousVersions: ['1.0.0-beta.1'],
      }),
    ).toBe(true)
    expect(
      isPrereleaseVersionCommit({
        changedFiles: [
          '.changeset/pre.json',
          'packages/react-audio-native/package.json',
        ],
        currentPrereleaseState,
        currentVersions: ['1.0.0-beta.2'],
        eventName: 'pull_request',
        beforeIsAncestorOfHead: true,
        manifestPaths: ['packages/react-audio-native/package.json'],
        previousPrereleaseState,
        previousVersions: ['1.0.0-beta.1'],
      }),
    ).toBe(false)
    expect(
      isPrereleaseVersionCommit({
        changedFiles: [
          '.changeset/pre.json',
          'packages/react-audio-native/package.json',
        ],
        currentPrereleaseState,
        currentVersions: ['1.0.0-beta.2'],
        eventName: 'push',
        beforeIsAncestorOfHead: true,
        manifestPaths: ['packages/react-audio-native/package.json'],
        previousPrereleaseState: currentPrereleaseState,
        previousVersions: ['1.0.0-beta.2'],
      }),
    ).toBe(false)
    expect(
      isPrereleaseVersionCommit({
        changedFiles: [
          '.changeset/pre.json',
          'packages/react-audio-native/package.json',
        ],
        currentPrereleaseState,
        currentVersions: ['1.0.0-beta.2'],
        eventName: 'workflow_dispatch',
        beforeIsAncestorOfHead: true,
        manifestPaths: ['packages/react-audio-native/package.json'],
        previousPrereleaseState,
        previousVersions: ['1.0.0-beta.1'],
      }),
    ).toBe(true)
    expect(
      isPrereleaseVersionCommit({
        changedFiles: [
          '.changeset/pre.json',
          'packages/react-audio-native/package.json',
          'packages/react-audio-native/src/index.ts',
        ],
        currentPrereleaseState,
        currentVersions: ['1.0.0-beta.2'],
        eventName: 'push',
        beforeIsAncestorOfHead: true,
        manifestPaths: ['packages/react-audio-native/package.json'],
        previousPrereleaseState,
        previousVersions: ['1.0.0-beta.1'],
      }),
    ).toBe(false)
    expect(
      isPrereleaseVersionCommit({
        changedFiles: [
          '.changeset/pre.json',
          'packages/react-audio-native/package.json',
        ],
        currentPrereleaseState,
        currentVersions: ['1.0.0-beta.2'],
        eventName: 'push',
        beforeIsAncestorOfHead: false,
        manifestPaths: ['packages/react-audio-native/package.json'],
        previousPrereleaseState,
        previousVersions: ['1.0.0-beta.1'],
      }),
    ).toBe(false)
  })

  it('accepts only an allowlisted stable version commit with a removed package changeset', () => {
    const manifestPaths = ['packages/react-audio-native/package.json']
    const releaseFiles = [
      '.changeset/pre.json',
      '.changeset/react-audio-v1.md',
      'packages/react-audio-native/package.json',
      'packages/react-audio-native/CHANGELOG.md',
      'packages/react-audio-native/README.md',
      'pnpm-lock.yaml',
    ]
    const releaseInput = {
      beforeIsAncestorOfHead: true,
      changedFiles: releaseFiles,
      currentPrereleaseState: null,
      currentVersions: ['1.0.0'],
      deletedFiles: ['.changeset/pre.json', '.changeset/react-audio-v1.md'],
      eventName: 'push',
      manifestPaths,
      previousPrereleaseState: {
        changesets: ['react-audio-v1'],
        mode: 'exit',
        tag: 'beta',
      },
      previousVersions: ['1.0.0-beta.2'],
      removedPackageChangeset: true,
    } as const

    expect(isStableVersionCommit(releaseInput)).toBe(true)
    expect(
      isStableVersionCommit({
        ...releaseInput,
        changedFiles: [
          ...releaseFiles,
          'packages/react-audio-native/src/index.ts',
        ],
      }),
    ).toBe(false)
    expect(
      isStableVersionCommit({
        ...releaseInput,
        removedPackageChangeset: false,
      }),
    ).toBe(false)
    expect(
      isStableVersionCommit({
        ...releaseInput,
        deletedFiles: ['.changeset/pre.json'],
      }),
    ).toBe(false)
    expect(
      isStableVersionCommit({
        ...releaseInput,
        currentVersions: ['1.0.0-beta.3'],
      }),
    ).toBe(false)
    expect(
      isStableVersionCommit({
        ...releaseInput,
        currentVersions: ['0.9.0'],
      }),
    ).toBe(false)
  })

  it('accepts later stable patch release commits without prerelease state', () => {
    expect(
      isStableVersionCommit({
        beforeIsAncestorOfHead: true,
        changedFiles: [
          '.changeset/fix-player.md',
          'packages/react-audio-native/package.json',
          'packages/react-audio-native/CHANGELOG.md',
          'packages/react-audio-native/README.md',
          'pnpm-lock.yaml',
        ],
        currentPrereleaseState: null,
        currentVersions: ['1.0.1'],
        deletedFiles: ['.changeset/fix-player.md'],
        eventName: 'workflow_dispatch',
        manifestPaths: ['packages/react-audio-native/package.json'],
        previousPrereleaseState: null,
        previousVersions: ['1.0.0'],
        removedPackageChangeset: true,
      }),
    ).toBe(true)
  })

  it('accepts a combined pre-to-exit stable version commit', () => {
    expect(
      isStableVersionCommit({
        beforeIsAncestorOfHead: true,
        changedFiles: [
          '.changeset/pre.json',
          '.changeset/stable-change.md',
          'packages/react-audio-native/package.json',
          'packages/react-audio-native/CHANGELOG.md',
          'packages/react-audio-native/README.md',
        ],
        currentPrereleaseState: {
          changesets: ['stable-change'],
          mode: 'exit',
          tag: 'beta',
        },
        currentVersions: ['1.0.0'],
        deletedFiles: ['.changeset/stable-change.md'],
        eventName: 'push',
        manifestPaths: ['packages/react-audio-native/package.json'],
        previousPrereleaseState: {
          changesets: ['stable-change'],
          mode: 'pre',
          tag: 'beta',
        },
        previousVersions: ['1.0.0-beta.2'],
        removedPackageChangeset: true,
      }),
    ).toBe(true)
  })

  it('detects a stable version-only push at the live default-branch head', async () => {
    const repositoryRoot = await createFixture({
      changesetId: 'stable-change',
      consumedChangesets: ['stable-change'],
      mode: 'exit',
    })
    const manifestPath = 'packages/react-audio-native/package.json'
    const packageDirectory = join(repositoryRoot, 'packages/react-audio-native')
    await mkdir(packageDirectory, { recursive: true })
    await writeFile(
      join(repositoryRoot, manifestPath),
      JSON.stringify({ name: 'react-audio-native', version: '1.0.0-beta.2' }),
    )
    await writeFile(join(packageDirectory, 'CHANGELOG.md'), '# Changelog\n')
    await writeFile(
      join(packageDirectory, 'README.md'),
      'pnpm add react-audio-native@next\n',
    )

    await execFileAsync('git', ['init', '-b', 'main'], { cwd: repositoryRoot })
    await execFileAsync(
      'git',
      ['config', 'user.email', 'release@example.com'],
      {
        cwd: repositoryRoot,
      },
    )
    await execFileAsync('git', ['config', 'user.name', 'Release Test'], {
      cwd: repositoryRoot,
    })
    await execFileAsync('git', ['add', '.'], { cwd: repositoryRoot })
    await execFileAsync('git', ['commit', '-m', 'stable release source'], {
      cwd: repositoryRoot,
    })
    const { stdout: beforeShaOutput } = await execFileAsync(
      'git',
      ['rev-parse', 'HEAD'],
      { cwd: repositoryRoot, encoding: 'utf8' },
    )

    await rm(join(repositoryRoot, '.changeset/pre.json'))
    await rm(join(repositoryRoot, '.changeset/stable-change.md'))
    await writeFile(
      join(repositoryRoot, manifestPath),
      JSON.stringify({ name: 'react-audio-native', version: '1.0.0' }),
    )
    await writeFile(
      join(packageDirectory, 'CHANGELOG.md'),
      '# Changelog\n\n## 1.0.0\n',
    )
    await writeFile(
      join(packageDirectory, 'README.md'),
      'pnpm add react-audio-native@1.0.0\n',
    )
    await execFileAsync('git', ['add', '--all'], { cwd: repositoryRoot })
    await execFileAsync('git', ['commit', '-m', 'version stable package'], {
      cwd: repositoryRoot,
    })
    const { stdout: releaseHeadShaOutput } = await execFileAsync(
      'git',
      ['rev-parse', 'HEAD'],
      { cwd: repositoryRoot, encoding: 'utf8' },
    )
    const remoteRoot = await mkdtemp(join(tmpdir(), 'audio-stable-remote-'))
    temporaryDirectories.push(remoteRoot)
    await execFileAsync(
      'git',
      ['init', '--bare', '--initial-branch=main', remoteRoot],
      { cwd: repositoryRoot },
    )
    await execFileAsync('git', ['remote', 'add', 'origin', remoteRoot], {
      cwd: repositoryRoot,
    })
    await execFileAsync('git', ['push', '--set-upstream', 'origin', 'main'], {
      cwd: repositoryRoot,
    })

    await expect(
      detectStableVersionCommit(repositoryRoot, [manifestPath], {
        beforeSha: beforeShaOutput.trim(),
        defaultBranch: 'main',
        eventName: 'push',
        headSha: releaseHeadShaOutput.trim(),
      }),
    ).resolves.toBe(true)
    await expect(
      detectStableVersionCommit(repositoryRoot, [manifestPath], {
        beforeSha: beforeShaOutput.trim(),
        defaultBranch: 'main',
        eventName: 'push',
        headSha: beforeShaOutput.trim(),
      }),
    ).resolves.toBe(false)
  })

  it('accepts a version-only rebase sequence when the previous tip remains an ancestor', async () => {
    const repositoryRoot = await createFixture({
      changesetId: 'next-change',
      consumedChangesets: ['bootstrap'],
    })
    const packageDirectory = join(repositoryRoot, 'packages/react-audio-native')
    await mkdir(packageDirectory, { recursive: true })
    await writeFile(
      join(packageDirectory, 'package.json'),
      JSON.stringify({ name: 'react-audio-native', version: '1.0.0-beta.1' }),
    )
    await writeFile(join(packageDirectory, 'CHANGELOG.md'), '# Changelog\n')

    await execFileAsync('git', ['init', '-b', 'main'], { cwd: repositoryRoot })
    await execFileAsync(
      'git',
      ['config', 'user.email', 'release@example.com'],
      {
        cwd: repositoryRoot,
      },
    )
    await execFileAsync('git', ['config', 'user.name', 'Release Test'], {
      cwd: repositoryRoot,
    })
    await execFileAsync('git', ['add', '.'], { cwd: repositoryRoot })
    await execFileAsync('git', ['commit', '-m', 'initial'], {
      cwd: repositoryRoot,
    })
    const { stdout: beforeShaOutput } = await execFileAsync(
      'git',
      ['rev-parse', 'HEAD'],
      { cwd: repositoryRoot, encoding: 'utf8' },
    )

    await writeFile(
      join(packageDirectory, 'package.json'),
      JSON.stringify({ name: 'react-audio-native', version: '1.0.0-beta.2' }),
    )
    await execFileAsync('git', ['add', '.'], { cwd: repositoryRoot })
    await execFileAsync('git', ['commit', '-m', 'version package'], {
      cwd: repositoryRoot,
    })
    await writeFile(
      join(repositoryRoot, '.changeset/pre.json'),
      JSON.stringify({
        changesets: ['bootstrap', 'next-change'],
        mode: 'pre',
        tag: 'beta',
      }),
    )
    await writeFile(
      join(packageDirectory, 'CHANGELOG.md'),
      '# Changelog\n\n## 1.0.0-beta.2\n',
    )
    await execFileAsync('git', ['add', '.'], { cwd: repositoryRoot })
    await execFileAsync('git', ['commit', '-m', 'record prerelease state'], {
      cwd: repositoryRoot,
    })
    const { stdout: releaseHeadShaOutput } = await execFileAsync(
      'git',
      ['rev-parse', 'HEAD'],
      { cwd: repositoryRoot, encoding: 'utf8' },
    )
    const remoteRoot = await mkdtemp(join(tmpdir(), 'audio-release-remote-'))
    temporaryDirectories.push(remoteRoot)
    await execFileAsync(
      'git',
      ['init', '--bare', '--initial-branch=main', remoteRoot],
      { cwd: repositoryRoot },
    )
    await execFileAsync('git', ['remote', 'add', 'origin', remoteRoot], {
      cwd: repositoryRoot,
    })
    await execFileAsync('git', ['push', '--set-upstream', 'origin', 'main'], {
      cwd: repositoryRoot,
    })

    await expect(
      detectPrereleaseVersionCommit(
        repositoryRoot,
        ['packages/react-audio-native/package.json'],
        {
          beforeSha: beforeShaOutput.trim(),
          defaultBranch: 'main',
          eventName: 'push',
          headSha: releaseHeadShaOutput.trim(),
        },
      ),
    ).resolves.toBe(true)
    await expect(
      detectPrereleaseVersionCommit(
        repositoryRoot,
        ['packages/react-audio-native/package.json'],
        {
          beforeSha: beforeShaOutput.trim(),
          eventName: 'workflow_dispatch',
        },
      ),
    ).resolves.toBe(false)
    await expect(
      detectPrereleaseVersionCommit(
        repositoryRoot,
        ['packages/react-audio-native/package.json'],
        {
          beforeSha: beforeShaOutput.trim(),
          defaultBranch: 'main',
          eventName: 'workflow_dispatch',
          headSha: releaseHeadShaOutput.trim(),
        },
      ),
    ).resolves.toBe(true)

    await execFileAsync(
      'git',
      ['checkout', '--detach', releaseHeadShaOutput.trim()],
      { cwd: repositoryRoot },
    )

    const advancingCheckout = await mkdtemp(
      join(tmpdir(), 'audio-release-advance-'),
    )
    temporaryDirectories.push(advancingCheckout)
    await execFileAsync('git', ['clone', remoteRoot, advancingCheckout], {
      cwd: repositoryRoot,
    })
    await execFileAsync(
      'git',
      ['config', 'user.email', 'release@example.com'],
      { cwd: advancingCheckout },
    )
    await execFileAsync('git', ['config', 'user.name', 'Release Test'], {
      cwd: advancingCheckout,
    })
    await writeFile(
      join(advancingCheckout, 'packages/react-audio-native/CHANGELOG.md'),
      '# Changelog\n\n## 1.0.0-beta.2\n\nFormatting follow-up.\n',
    )
    await execFileAsync('git', ['add', '.'], { cwd: advancingCheckout })
    await execFileAsync('git', ['commit', '-m', 'refresh lockfile'], {
      cwd: advancingCheckout,
    })
    await execFileAsync('git', ['push', 'origin', 'main'], {
      cwd: advancingCheckout,
    })
    await expect(
      detectPrereleaseVersionCommit(
        repositoryRoot,
        ['packages/react-audio-native/package.json'],
        {
          beforeSha: beforeShaOutput.trim(),
          defaultBranch: 'main',
          eventName: 'workflow_dispatch',
          headSha: releaseHeadShaOutput.trim(),
        },
      ),
    ).resolves.toBe(false)
  })

  it('requires a version PR while a non-empty prerelease changeset is pending', async () => {
    const repositoryRoot = await createFixture({
      changesetId: 'pending-change',
    })

    await expect(inspectReleaseState(repositoryRoot)).resolves.toEqual({
      mode: 'beta',
      pendingChangesets: ['pending-change'],
      prereleaseReady: false,
    })
  })

  it('publishes after the version PR retains a consumed prerelease changeset', async () => {
    const repositoryRoot = await createFixture({
      changesetId: 'consumed-change',
      consumedChangesets: ['consumed-change'],
    })

    await expect(inspectReleaseState(repositoryRoot)).resolves.toEqual({
      mode: 'beta',
      pendingChangesets: [],
      prereleaseReady: true,
    })
  })

  it('ignores an empty changeset when deciding prerelease readiness', async () => {
    const repositoryRoot = await createFixture({
      changesetBody: '---\n---\n\nNo package release.\n',
      changesetId: 'empty-change',
    })

    await expect(inspectReleaseState(repositoryRoot)).resolves.toMatchObject({
      mode: 'beta',
      prereleaseReady: true,
    })
  })

  it('ignores changesets that target only private workspaces', async () => {
    const repositoryRoot = await createFixture({
      changesetBody: '---\n"demo-react": patch\n---\n\nDemo-only change.\n',
      changesetId: 'demo-only',
    })
    const manifestPath = 'packages/react-audio-native/package.json'
    await mkdir(join(repositoryRoot, 'packages/react-audio-native'), {
      recursive: true,
    })
    await writeFile(
      join(repositoryRoot, manifestPath),
      JSON.stringify({ name: 'react-audio-native', version: '1.0.0-beta.1' }),
    )

    await expect(
      inspectReleaseState(repositoryRoot, [manifestPath]),
    ).resolves.toEqual({
      mode: 'beta',
      pendingChangesets: [],
      prereleaseReady: true,
    })
  })

  it('treats absent and exit pre-state as stable release flows', async () => {
    const stableRoot = await createFixture({ withPrereleaseState: false })
    const exitRoot = await createFixture({ mode: 'exit' })

    await expect(inspectReleaseState(stableRoot)).resolves.toMatchObject({
      mode: 'stable',
      prereleaseReady: false,
    })
    await expect(inspectReleaseState(exitRoot)).resolves.toMatchObject({
      mode: 'stable',
      prereleaseReady: false,
    })
  })
})
