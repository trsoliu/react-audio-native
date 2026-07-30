import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const installSectionStart = '<!-- release-install:start -->'
const installSectionEnd = '<!-- release-install:end -->'
const releaseVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const stableVersionPattern = /^\d+\.\d+\.\d+$/

interface PackageManifest {
  version?: unknown
}

function installSection(version: string): string {
  if (!releaseVersionPattern.test(version)) {
    throw new Error(`Unsupported package release version: ${version}`)
  }

  if (stableVersionPattern.test(version)) {
    return `${installSectionStart}

\`\`\`bash
pnpm add react-audio-native@${version}
\`\`\`

Use \`react-audio-native@next\` only when intentionally validating a prerelease. Import the standalone
package CSS; consumers do not need Tailwind:

${installSectionEnd}`
  }

  return `${installSectionStart}

\`\`\`bash
pnpm add react-audio-native@next
\`\`\`

The 1.0 line is currently a prerelease. Import the standalone package CSS; consumers do not need
Tailwind:

${installSectionEnd}`
}

export function updateReleaseReadme(contents: string, version: string): string {
  const startIndex = contents.indexOf(installSectionStart)
  const endIndex = contents.indexOf(installSectionEnd)
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error(
      'Package README is missing its managed release install section.',
    )
  }

  return (
    contents.slice(0, startIndex) +
    installSection(version) +
    contents.slice(endIndex + installSectionEnd.length)
  )
}

async function runChangesetsVersion(): Promise<void> {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, ['exec', 'changeset', 'version'], {
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise()
        return
      }
      reject(
        new Error(
          `Changesets version failed${signal ? ` with signal ${signal}` : ` with exit code ${code ?? 'unknown'}`}.`,
        ),
      )
    })
  })
}

export async function versionPackages(
  manifestPath = 'packages/react-audio-native/package.json',
  readmePath = 'packages/react-audio-native/README.md',
): Promise<void> {
  await runChangesetsVersion()

  const manifest = JSON.parse(
    await readFile(resolve(process.cwd(), manifestPath), 'utf8'),
  ) as PackageManifest
  if (typeof manifest.version !== 'string') {
    throw new Error(`${manifestPath} must contain a package version.`)
  }

  const absoluteReadmePath = resolve(process.cwd(), readmePath)
  const currentReadme = await readFile(absoluteReadmePath, 'utf8')
  const nextReadme = updateReleaseReadme(currentReadme, manifest.version)
  if (nextReadme !== currentReadme) {
    await writeFile(absoluteReadmePath, nextReadme)
  }
}

const invokedModule = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : null

if (invokedModule === import.meta.url) {
  void versionPackages().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
