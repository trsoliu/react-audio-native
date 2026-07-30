import { copyFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { build as viteBuild } from 'vite'

const packageRoot = resolve(import.meta.dirname, '..')
const outputDirectory = resolve(packageRoot, 'dist')

await viteBuild({
  configFile: resolve(packageRoot, 'vite.config.ts'),
  mode: 'library',
})
await copyFile(
  resolve(outputDirectory, 'index.d.ts'),
  resolve(outputDirectory, 'index.d.cts'),
)
await writeFile(
  resolve(outputDirectory, 'style.css.d.ts'),
  'declare const stylesheet: string\nexport default stylesheet\n',
)
