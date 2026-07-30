import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { gzipSync } from 'node:zlib'

const execute = promisify(execFile)
const packageRoot = resolve(import.meta.dirname, '..')
const { stdout } = await execute('npm', ['pack', '--dry-run', '--json'], {
  cwd: packageRoot,
})
interface PackReport {
  files: Array<{ path: string }>
}

const reports = JSON.parse(stdout) as PackReport[] | Record<string, PackReport>
const report = Array.isArray(reports) ? reports[0] : Object.values(reports)[0]
assert(report, 'npm pack did not return a package report')

const packedPaths = report.files.map((file) => file.path)
const forbiddenPaths = packedPaths.filter((path) =>
  /(^|\/)(apps?|src|tests?|fixtures?|coverage|node_modules|components\/ui)(\/|$)|shadcn|radix|sonner/i.test(
    path,
  ),
)
assert.deepEqual(
  forbiddenPaths,
  [],
  `Unexpected packed files: ${forbiddenPaths.join(', ')}`,
)

const manifest = JSON.parse(
  await readFile(resolve(packageRoot, 'package.json'), 'utf8'),
) as { dependencies?: Record<string, string>; version: string }
const forbiddenDependencies = Object.keys(manifest.dependencies ?? {}).filter(
  (name) =>
    /shadcn|radix|sonner|class-variance-authority|tailwind-merge/i.test(name),
)
assert.deepEqual(
  forbiddenDependencies,
  [],
  `Demo-only dependencies leaked into the package: ${forbiddenDependencies.join(', ')}`,
)

const audioCoreRange = manifest.dependencies?.['@trsoliu/audio-core']
assert(audioCoreRange, 'Published package must depend on @trsoliu/audio-core')
if (!manifest.version.includes('-')) {
  assert(
    !audioCoreRange.includes('-'),
    `Stable React releases cannot depend on a prerelease audio core: ${audioCoreRange}`,
  )
}

const esm = await readFile(resolve(packageRoot, 'dist/index.js'))
const css = await readFile(resolve(packageRoot, 'dist/style.css'))
assert(
  gzipSync(esm).byteLength <= 25 * 1024,
  'Component ESM exceeds 25 KB gzip',
)
assert(
  gzipSync(css).byteLength <= 12 * 1024,
  'Component CSS exceeds 12 KB gzip',
)
assert(
  /^["']use client["'];/.test(esm.toString('utf8')),
  'Published ESM build lost the Next client boundary',
)

const cssText = css.toString('utf8')
assert(
  !cssText.includes('box-sizing:border-box'),
  'Tailwind Preflight leaked into CSS',
)
assert(
  !cssText.includes('@layer'),
  'Global cascade layers leaked into library CSS',
)
assert(
  !cssText.includes('.flex{'),
  'Unscoped Tailwind utilities leaked into library CSS',
)
assert(
  !cssText.includes('oklch('),
  'Chromium 96-incompatible OKLCH leaked into CSS',
)
assert(
  !cssText.includes('color-mix('),
  'Chromium 96-incompatible color-mix leaked into CSS',
)

for (const path of packedPaths.filter((path) =>
  /\.(?:[cm]?js|css|map|json|ts)$/.test(path),
)) {
  const content = await readFile(resolve(packageRoot, path), 'utf8')
  assert(
    !content.includes(packageRoot),
    `Absolute package path leaked into ${path}`,
  )
  assert(!content.includes('/Users/'), `Local user path leaked into ${path}`)
}

await execute(
  'node',
  [
    '--input-type=module',
    '--eval',
    "delete globalThis.window; delete globalThis.document; await import('./dist/index.js')",
  ],
  { cwd: packageRoot },
)

console.log(
  `Validated ${packedPaths.length} packed files with no Demo UI leakage.`,
)
